from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
import json
import time


class RouteView(APIView):
    def get(self, request):
        """
        Obsługuje żądanie wyznaczenia trasy między dwoma punktami.

        Parametry w URL (Query Params):
        -------------------------------
        start_lat (float) : Szerokość geograficzna punktu startowego (wymagane).
        start_lon (float) : Długość geograficzna punktu startowego (wymagane).
        end_lat   (float) : Szerokość geograficzna punktu końcowego (wymagane).
        end_lon   (float) : Długość geograficzna punktu końcowego (wymagane).

        vehicle_speed (float)  : Maksymalna prędkość pojazdu w km/h (np. 50, 90, 140). Domyślnie 140.

        algorithm (str)   : Algorytm użyty do szukania ścieżki (opcjonalne).
                            Dostępne wartości:
                            - 'astar'    (domyślnie, algorytm A*)
                            - 'dijkstra' (algorytm Dijkstry)

        Przykład użycia:
        GET /api/get_path/?start_lat=52.231&start_lon=21.006&end_lat=52.164&end_lon=21.084&vehicle_speed=140&algorithm=astar

        """
        # 1. Walidacja i pobranie parametrów
        try:
            start_lat = float(request.query_params.get("start_lat"))
            start_lon = float(request.query_params.get("start_lon"))
            end_lat = float(request.query_params.get("end_lat"))
            end_lon = float(request.query_params.get("end_lon"))
            max_speed = float(request.query_params.get("vehicle_speed", 140.0))
            if max_speed <= 0:
                return Response(
                    {"error": "Prędkość musi być większa od 0"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            alg_type = request.query_params.get("algorithm", "astar")
        except (TypeError, ValueError):
            return Response(
                {
                    "error": "Wymagane parametry: start_lat, start_lon, end_lat, end_lon (float)"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        func_start_time = time.perf_counter()

        # 2. Wybór funkcji SQL na podstawie parametru
        if alg_type == "dijkstra":
            function_name = "find_best_route_dijkstra"
        else:
            function_name = "find_best_route_astar"

        # 3. Zapytanie SQL
        # Wywołujemy funkcję stworzoną w bazie. Używamy ST_AsGeoJSON, aby PostGIS
        # od razu zwrócił nam geometrię w formacie JSON (tekstowym).
        sql_query = f"""
            SELECT 
                seq, 
                cost_s, 
                agg_cost_s, 
                length_m, 
                agg_length_m,
                ST_AsGeoJSON(geom) as geom_json
            FROM {function_name}(%s, %s, %s, %s, %s, %s)
        """

        response_data = []

        # 4. Wywołanie funkcji dla trzech kryteriów wyszukiwania trasy
        criterions = ["time", "distance", "main_roads"]
        for criterion in criterions:

            params = [start_lon, start_lat, end_lon, end_lat, max_speed, criterion]

            rows = []
            start_time = time.perf_counter()
            with connection.cursor() as cursor:
                cursor.execute(sql_query, params)
                # Pobieramy nazwy kolumn i tworzymy listę słowników
                columns = [col[0] for col in cursor.description]
                rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

            end_time = time.perf_counter()
            execution_time = end_time - start_time

            if not rows:
                return Response(
                    {"error": "Nie znaleziono trasy między podanymi punktami."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Budowanie GeoJSON
            features = []
            total_time = 0.0
            total_dist = 0.0

            for row in rows:
                # Pomijamy wiersze bez geometrii
                if row["geom_json"]:
                    features.append(
                        {
                            "type": "Feature",
                            "geometry": json.loads(row["geom_json"]),
                            "properties": {
                                "seq": row["seq"],
                                "cost_s": row["cost_s"],
                                "length_m": row["length_m"],
                            },
                        }
                    )
                    # Ostatni wiersz będzie miał sumę całkowitą
                    total_time = row["agg_cost_s"]
                    total_dist = row["agg_length_m"]

            func_end_time = time.perf_counter()
            func_execution_time = func_end_time - func_start_time

            response_data.append(
                {
                    "type": "FeatureCollection",
                    "metadata": {
                        "total_time_seconds": total_time,
                        "total_distance_meters": total_dist,
                        "vehicle_speed": max_speed,
                        "algorithm": alg_type,
                        "criterion": criterion,
                        "algorithm_duration": round(execution_time, 4),
                        "function_duration": round(func_execution_time, 4),
                    },
                    "features": features,
                }
            )

        return Response(response_data)


class StreetView(APIView):
    def get(self, request):
        """
        Obsługuje żądanie wyznaczenia punktu na podstawie nazwy ulicy.

        Parametry w URL (Query Params):
        -------------------------------
        street_name (str) : Nazwa ulicy

        Przykład użycia:
        GET /api/get_street/?street_name=Puławska

        """
        street_name = request.query_params.get("street_name")

        if not street_name:
            return Response(
                {"error": "Parametr 'street_name' jest wymagany"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with connection.cursor() as cursor:
            cursor.execute("SELECT lat, lon FROM find_street_center(%s)", [street_name])
            row = cursor.fetchone()

            # Jeśli ulica nie istnieje, PostGIS zwróci NULL, co w Pythonie da (None, None)
            if row is None or row[0] is None:
                return Response(
                    {"error": f"Nie znaleziono ulicy o nazwie: {street_name}"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response({"street": street_name, "lat": row[0], "lon": row[1]})


class BoundariesView(APIView):
    def get(self, request):
        """
        Obsługuje żądanie wyznaczenia granic mapy w bazie danych.

        Parametry w URL (Query Params):
        -------------------------------
        brak

        Przykład użycia:
        GET /api/get_boundaries/

        """
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT min_lat, min_lon, max_lat, max_lon FROM get_map_boundaries()"
            )
            row = cursor.fetchone()

            if row is None or row[0] is None:
                return Response(
                    {"error": "Baza danych jest pusta"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response(
                {
                    "min_lat": row[0],
                    "min_lon": row[1],
                    "max_lat": row[2],
                    "max_lon": row[3],
                    "bounds": [[row[0], row[1]], [row[2], row[3]]],
                }
            )
