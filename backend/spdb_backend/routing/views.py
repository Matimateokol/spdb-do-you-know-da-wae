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

        vehicle   (str)   : Typ pojazdu, wpływający na maksymalną prędkość (opcjonalne).
                            Dostępne wartości:
                            - 'car'  (domyślnie, max 140 km/h)
                            - 'bike' (max 20 km/h)
                            - 'foot' (max 5 km/h)

        algorithm (str)   : Algorytm użyty do szukania ścieżki (opcjonalne).
                            Dostępne wartości:
                            - 'astar'    (domyślnie, algorytm A* - szybszy)
                            - 'dijkstra' (algorytm Dijkstry - do porównań)

        Przykład użycia:
        GET /api/get_path/?start_lat=52.23&start_lon=21.01&end_lat=52.16&end_lon=21.08&vehicle=bike&algorithm=astar
        """
        # 1. Walidacja i pobranie parametrów
        try:
            start_lat = float(request.query_params.get("start_lat"))
            start_lon = float(request.query_params.get("start_lon"))
            end_lat = float(request.query_params.get("end_lat"))
            end_lon = float(request.query_params.get("end_lon"))
            vehicle_type = request.query_params.get("vehicle", "car")
            alg_type = request.query_params.get("algorithm", "astar")
        except (TypeError, ValueError):
            return Response(
                {
                    "error": "Wymagane parametry: start_lat, start_lon, end_lat, end_lon (float)"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        func_start_time = time.perf_counter()

        # 2. Mapowanie pojazdu na prędkość
        vehicle_speeds = {"car": 140.0, "bike": 20.0, "foot": 5.0}
        max_speed = vehicle_speeds.get(vehicle_type, 140.0)

        # 3. Wybór funkcji SQL na podstawie parametru
        if alg_type == "dijkstra":
            function_name = "find_best_route_dijkstra"
        else:
            function_name = "find_best_route_astar"

        # 4. Zapytanie SQL
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
            FROM {function_name}(%s, %s, %s, %s, %s)
        """

        params = [start_lon, start_lat, end_lon, end_lat, max_speed]

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

        # 5. Budowanie GeoJSON
        features = []
        total_time = 0.0
        total_dist = 0.0

        for row in rows:
            # Pomijamy wiersze bez geometrii (jeśli jakieś są)
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

        response_data = {
            "type": "FeatureCollection",
            "metadata": {
                "total_time_seconds": total_time,
                "total_distance_meters": total_dist,
                "vehicle": vehicle_type,
                "max_speed_kmh": max_speed,
                "algorithm": alg_type,
                "algorithm_duration": round(execution_time, 4),
                "function_duration": round(func_execution_time, 4),
            },
            "features": features,
        }

        return Response(response_data)
