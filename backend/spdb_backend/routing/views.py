from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
import json


class RouteView(APIView):
    def get(self, request):
        """
        Obsługuje zapytanie GET o wyznaczenie trasy.
        Przykładowy URL: /api/get_path/?start_lat=52.2&start_lon=21.0&end_lat=52.1&end_lon=21.1&vehicle=car
        """
        # 1. Walidacja i pobranie parametrów
        try:
            start_lat = float(request.query_params.get("start_lat"))
            start_lon = float(request.query_params.get("start_lon"))
            end_lat = float(request.query_params.get("end_lat"))
            end_lon = float(request.query_params.get("end_lon"))
            vehicle_type = request.query_params.get("vehicle", "car")
        except (TypeError, ValueError):
            return Response(
                {
                    "error": "Wymagane parametry: start_lat, start_lon, end_lat, end_lon (float)"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Mapowanie pojazdu na prędkość (zgodnie z dokumentacją projektu)
        # [cite: 78] Car: 140 km/h, Bike: 20 km/h
        vehicle_speeds = {"car": 140.0, "bike": 20.0, "foot": 5.0}
        max_speed = vehicle_speeds.get(vehicle_type, 140.0)

        # 3. Zapytanie SQL
        # Wywołujemy funkcję stworzoną w bazie. Używamy ST_AsGeoJSON, aby PostGIS
        # od razu zwrócił nam geometrię w formacie JSON (tekstowym).
        sql_query = """
            SELECT 
                seq, 
                cost_s, 
                agg_cost_s, 
                length_m, 
                agg_length_m,
                ST_AsGeoJSON(geom) as geom_json
            FROM find_best_route_astar(%s, %s, %s, %s, %s)
        """

        # Kolejność parametrów musi zgadzać się z definicją funkcji w SQL
        # (x_start, y_start, x_end, y_end, vehicle_max_speed)
        params = [start_lon, start_lat, end_lon, end_lat, max_speed]

        rows = []
        with connection.cursor() as cursor:
            cursor.execute(sql_query, params)
            # Pobieramy nazwy kolumn i tworzymy listę słowników
            columns = [col[0] for col in cursor.description]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

        if not rows:
            return Response(
                {"error": "Nie znaleziono trasy między podanymi punktami."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 4. Budowanie GeoJSON (FeatureCollection)
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
                # Aktualizujemy podsumowanie z bieżącego wiersza (ostatni będzie miał sumę całkowitą)
                total_time = row["agg_cost_s"]
                total_dist = row["agg_length_m"]

        response_data = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "total_time_seconds": total_time,
                "total_distance_meters": total_dist,
                "vehicle": vehicle_type,
                "max_speed_kmh": max_speed,
            },
        }

        return Response(response_data)
