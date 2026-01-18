CREATE OR REPLACE FUNCTION find_best_route_dijkstra(
    x_start double precision, y_start double precision, -- Start (Lon, Lat)
    x_end double precision,   y_end double precision,   -- Koniec (Lon, Lat)
    vehicle_max_speed_kmh double precision DEFAULT 140, -- V_max pojazdu
    criteria text DEFAULT 'time'    --Wartości: time, distance, main_roads
)
RETURNS TABLE (
    seq integer,
    node bigint,
    edge bigint,
    cost_s double precision, -- koszt w sekundach
    agg_cost_s double precision,
    length_m double precision, -- odległość w metrach
    agg_length_m double precision,
    geom geometry
) AS $$
DECLARE
    start_node bigint;
    end_node bigint;
    cost_sql text;
    reverse_cost_sql text;
    where_clause text;
BEGIN
    -- 1. Znajdź węzły
    start_node := get_nearest_node(x_start, y_start);
    end_node := get_nearest_node(x_end, y_end);

    IF start_node IS NULL OR end_node IS NULL THEN
        RAISE EXCEPTION 'Nie znaleziono węzła startowego lub końcowego w pobliżu podanych współrzędnych.';
    END IF;

    -- 2. Wybór kryterium
    IF criteria = 'distance' THEN

        cost_sql := 'length_m::float';
        reverse_cost_sql := 'length_m::float';

    ELSIF criteria = 'main_roads' THEN
        -- Jeśli droga ma maxspeed <= 30, zwiększamy jej koszt 2-krotnie
        cost_sql := format('
            (length_m / (LEAST(COALESCE(maxspeed_forward, 50), %s) / 3.6))::float * (CASE WHEN COALESCE(maxspeed_forward, 50) <= 30 THEN 2.0 ELSE 1.0 END)', 
            vehicle_max_speed_kmh);
            
        reverse_cost_sql := format('
            (length_m / (LEAST(COALESCE(maxspeed_backward, 50), %s) / 3.6))::float * (CASE WHEN COALESCE(maxspeed_backward, 50) <= 30 THEN 2.0 ELSE 1.0 END)', 
            vehicle_max_speed_kmh);

    ELSE
        cost_sql := format('(length_m / (LEAST(COALESCE(maxspeed_forward, 50), %s) / 3.6))::float', vehicle_max_speed_kmh);
        reverse_cost_sql := format('(length_m / (LEAST(COALESCE(maxspeed_backward, 50), %s) / 3.6))::float', vehicle_max_speed_kmh);
    END IF;

     -- 3. Klauzula WHERE
    -- Pobieramy tylko drogi w prostokącie rozszerzonym o 0.1 stopnia (ok 10km marginesu) wokół startu i celu.
    where_clause := format('the_geom && ST_Expand(ST_MakeEnvelope(%s, %s, %s, %s, 4326), 0.1)',
                            LEAST(x_start, x_end), LEAST(y_start, y_end),
                            GREATEST(x_start, x_end), GREATEST(y_start, y_end));

    IF vehicle_max_speed_kmh < 50 THEN
        where_clause := where_clause || ' AND COALESCE(maxspeed_forward, 50) <= 50';
    END IF;

    -- 4. Uruchom Dijkstrę
    RETURN QUERY
    SELECT
        r.seq,
        r.node,
        r.edge,
        (w.length_m / (LEAST(COALESCE(w.maxspeed_forward, 50), vehicle_max_speed_kmh) / 3.6))::float as cost_s,
        SUM(w.length_m / (LEAST(COALESCE(w.maxspeed_forward, 50), vehicle_max_speed_kmh) / 3.6)) OVER (ORDER BY r.seq)::float as agg_cost_s,
        w.length_m,
        SUM(w.length_m) OVER (ORDER BY r.seq) as agg_length_m,
        w.the_geom as geom
    FROM pgr_dijkstra(
        format(
            'SELECT gid as id, source, target,
            %s AS cost, %s AS reverse_cost
            FROM ways
            WHERE %s',
            cost_sql, reverse_cost_sql, where_clause
        ),
        start_node,
        end_node,
        directed := true
    ) r
    JOIN ways w ON r.edge = w.gid;
END;
$$ LANGUAGE plpgsql;