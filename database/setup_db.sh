#!/bin/bash

# --- KONFIGURACJA ---
CONTAINER_NAME="spdb_db"
DB_NAME="routing_db"
DB_USER="user"
DB_PASS="password"
SQL_FOLDER="./sql"
SQL_FILES=(
    "get_nearest_node.sql"
    "find_best_route_astar.sql"
    "sql/find_best_route_dijkstra.sql"
)

# Link do danych (Mazowieckie, format bz2 - skompresowany XML)
# Używamy Geofabrik, bo to stabilne źródło
DOWNLOAD_URL="https://download.bbbike.org/osm/extract/planet_20.354,51.922_21.669,52.473.osm.xz"
DOWNLOADED_ARCHIVE="planet_20.354,51.922_21.669,52.473.osm.xz"
FINAL_OSM_FILE="warszawa.osm"  # Tak plik będzie się nazywał po rozpakowaniu

# Kolory
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# --- 0. POBIERANIE DANYCH ---
echo -e "${CYAN}0. Sprawdzanie pliku z danymi...${NC}"

if [ -f "$FINAL_OSM_FILE" ]; then
    echo -e "${GREEN}   Plik $FINAL_OSM_FILE już istnieje. Pomijam pobieranie.${NC}"
else
    echo -e "${YELLOW}   Brak pliku $FINAL_OSM_FILE. Rozpoczynam pobieranie...${NC}"
    
    # 1. Pobieranie
    curl -L -o "$DOWNLOADED_ARCHIVE" "$DOWNLOAD_URL"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Błąd pobierania pliku! Sprawdź łącze internetowe.${NC}"
        exit 1
    fi

    # 2. Rozpakowanie 
    echo -e "${YELLOW}   Rozpakowywanie archiwum (to może chwilę potrwać)...${NC}"
    if [[ "$DOWNLOADED_ARCHIVE" == *.bz2 ]]; then
        # -k zostawia plik oryginalny, -d dekompresuje
        if command -v bunzip2 &> /dev/null; then
            bunzip2 -d "$DOWNLOADED_ARCHIVE"
        else
            echo -e "${RED}Błąd: Brak narzędzia bunzip2. Zainstaluj je lub rozpakuj plik ręcznie.${NC}"
            exit 1
        fi
    elif [[ "$DOWNLOADED_ARCHIVE" == *.zip ]]; then
        unzip "$DOWNLOADED_ARCHIVE"
    fi

    # 3. Zmiana nazwy (Geofabrik wypakuje się jako mazowieckie-latest.osm)
    EXTRACTED_NAME="${DOWNLOADED_ARCHIVE%.*}" # usuwa rozszerzenie .bz2
    echo "   Zmiana nazwy z $EXTRACTED_NAME na $FINAL_OSM_FILE..."
    mv "$EXTRACTED_NAME" "$FINAL_OSM_FILE"
    
    echo -e "${GREEN}   Gotowe. Mamy plik $FINAL_OSM_FILE.${NC}"
fi

# --- 1. START DOCKERA ---
echo -e "${CYAN}1. Restartowanie kontenerów...${NC}"
docker-compose down
docker-compose up -d

echo -n "   Czekanie na start bazy danych..."
MAX_RETRIES=30
COUNT=0
until docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" > /dev/null 2>&1; do
  echo -n "."
  sleep 2
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo -e "\n${RED}Błąd: Baza danych nie wystartowała.${NC}"
    exit 1
  fi
done
echo -e " ${GREEN}Gotowe.${NC}"

# --- 2. INSTALACJA NARZĘDZI ---
echo -e "${CYAN}2. Instalacja osm2pgrouting w kontenerze...${NC}"
docker exec -u 0 "$CONTAINER_NAME" bash -c "apt-get update > /dev/null 2>&1 && apt-get install -y osm2pgrouting osm2pgsql > /dev/null 2>&1"

# --- 3. AKTYWACJA ROZSZERZEŃ ---
echo -e "${CYAN}3. Aktywacja PostGIS i pgRouting...${NC}"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis;"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pgrouting;"

# --- 4. IMPORT MAPY ---
echo -e "${CYAN}4. Import mapy ($FINAL_OSM_FILE)...${NC}"
if [ -f "$FINAL_OSM_FILE" ]; then
    docker cp "$FINAL_OSM_FILE" "$CONTAINER_NAME:/tmp/data.osm"
    
    echo -e "${YELLOW}   Rozpoczynam import osm2pgrouting...${NC}"
    # Dodano flagę --clean aby usunąć stare dane przed importem
    docker exec "$CONTAINER_NAME" osm2pgrouting \
        -f //tmp/data.osm \
        -h localhost \
        -p 5432 \
        -d "$DB_NAME" \
        -U "$DB_USER" \
        -W "$DB_PASS" \
        --clean
else
    echo -e "${RED}Błąd krytyczny: Nie znaleziono pliku mapy!${NC}"
    exit 1
fi

# --- 5. SQL ---
echo -e "${CYAN}5. Wgrywanie skryptów SQL...${NC}"

if [ -d "$SQL_FOLDER" ]; then
    # Iteracja po tablicy zdefiniowanej na górze skryptu
    for sql_file in "${SQL_FILES[@]}"; do
        FULL_PATH="$SQL_FOLDER/$sql_file"
        
        if [ -f "$FULL_PATH" ]; then
            echo "   Wykonywanie: $sql_file"
            cat "$FULL_PATH" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
            
            if [ $? -eq 0 ]; then
                echo -e "   -> ${GREEN}OK${NC}"
            else
                echo -e "   -> ${RED}BŁĄD przy pliku $sql_file${NC}"
                # exit 1 # Odkomentuj, jeśli chcesz przerywać przy błędzie SQL
            fi
        else
            echo -e "   ${RED}Pominięto: Nie znaleziono pliku $FULL_PATH${NC}"
        fi
    done
else
    echo -e "   ${RED}Błąd: Nie znaleziono folderu $SQL_FOLDER${NC}"
fi

echo -e "${GREEN}--- ZAKOŃCZONO SUKCESEM ---${NC}"