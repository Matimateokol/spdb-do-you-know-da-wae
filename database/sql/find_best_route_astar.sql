CREATE OR REPLACE FUNCTION find_best_route_astar(
    x_start double precision, y_start double precision, -- Start (Lon, Lat)
    x_end double precision,   y_end double precision,   -- Koniec (Lon, Lat)
    vehicle_max_speed_kmh double precision DEFAULT 140  -- V_max pojazdu
)
RETURNS TABLE (
    seq integer,
    node bigint,
    edge bigint,
    cost_s double precision, -- koszt w sekundach
    agg_cost_s double precision,
    length_m double precision,
    agg_length_m double precision,
    geom geometry
) AS $$
DECLARE
    start_node bigint;
    end_node bigint;
BEGIN
    -- 1. Znajdź węzły startowy i końcowy
    start_node := get_nearest_node(x_start, y_start);
    end_node := get_nearest_node(x_end, y_end);

    IF start_node IS NULL OR end_node IS NULL THEN
        RAISE EXCEPTION 'Nie znaleziono węzła startowego lub końcowego w pobliżu podanych współrzędnych.';
    END IF;

    -- 2. Uruchom A*
    RETURN QUERY
    SELECT
        r.seq,
        r.node,
        r.edge,
        r.cost as cost_s,
        r.agg_cost as agg_cost_s,
        w.length_m,
        SUM(w.length_m) OVER (ORDER BY r.seq) as agg_length_m,
        w.the_geom as geom
    FROM pgr_astar(
        format(
            'SELECT gid as id, source, target,
            -- KOSZT (w sekundach) = Długość (m) / Prędkość (m/s)
            (length_m / (LEAST(COALESCE(maxspeed_forward, 50), %s) / 3.6))::float AS cost,
            (length_m / (LEAST(COALESCE(maxspeed_backward, 50), %s) / 3.6))::float AS reverse_cost,
            x1, y1, x2, y2
            FROM ways
            WHERE
            -- OPTYMALIZACJA: Bounding Box. Pobieramy tylko drogi w prostokącie
            -- rozszerzonym o 0.1 stopnia (ok 10km marginesu) wokół startu i celu.
            the_geom && ST_Expand(ST_MakeEnvelope(%s, %s, %s, %s, 4326), 0.1)',
            vehicle_max_speed_kmh, -- parametr do cost
            vehicle_max_speed_kmh, -- parametr do reverse_cost
            LEAST(x_start, x_end), LEAST(y_start, y_end), -- min X, min Y
            GREATEST(x_start, x_end), GREATEST(y_start, y_end) -- max X, max Y
        ),
        start_node,
        end_node,
        directed := true, -- uwzględnia jednokierunkowe
        heuristic := 2    -- 0=dijkstra, 2=euclidean (zalecane dla lat/lon)
    ) r
    JOIN ways w ON r.edge = w.gid;
END;
$$ LANGUAGE plpgsql;