#!/bin/bash

# --- KONFIGURACJA ---
CONTAINER_NAME="spdb_db"
DB_NAME="routing_db"
DB_USER="user"
SQL_FOLDER="./sql"

# Kolory
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Rozpoczynam aktualizację funkcji SQL...${NC}"

if [ ! -d "$SQL_FOLDER" ]; then
    echo -e "${RED}Błąd: Folder $SQL_FOLDER nie istnieje!${NC}"
    exit 1
fi

# Przetwarzamy każdy plik SQL po kolei
for sql_path in $(ls "$SQL_FOLDER"/*.sql | sort); do
    file_name=$(basename "$sql_path")
    
    # 1. Wyciągamy nazwę funkcji z nazwy pliku
    # Usuwamy rozszerzenie .sql
    func_name=$(echo "$file_name" | sed 's/\.sql$//')
    
    echo -e "${CYAN}Przetwarzanie: $func_name (z pliku $file_name)${NC}"

    # 2. Szukamy w bazie wszystkich przeciążonych wersji tej konkretnej funkcji
    # Budujemy polecenia DROP na podstawie oidu funkcji
    DROP_COMMANDS=$(docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT 'DROP FUNCTION IF EXISTS ' || quote_ident(p.proname) || '(' || pg_get_function_identity_arguments(p.oid) || ') CASCADE;'
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' 
          AND p.proname = '$func_name';")

    # 3. Wykonujemy usunięcie starych wersji
    if [ ! -z "$DROP_COMMANDS" ] && [ "$DROP_COMMANDS" != " " ]; then
        echo "$DROP_COMMANDS" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" > /dev/null
        echo -e "  ${YELLOW}- Usunięto stare wersje funkcji $func_name${NC}"
    fi

    # 4. Wgrywamy nową definicję
    cat "$sql_path" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}- Wgrano nową definicję z $file_name${NC}"
    else
        echo -e "  ${RED}- BŁĄD podczas wgrywania $file_name${NC}"
    fi
done

echo -e "${GREEN}--- AKTUALIZACJA ZAKOŃCZONA ---${NC}"