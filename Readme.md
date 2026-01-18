
# How to run project for the first time?

### DATABASE:
```cd database```
```./setup_db.sh```

### BACKEND:
```cd backend```
```python3 -m venv venv```

- On Windows 10/11 system: ```.\venv\Scripts\Activate```

- On Linux system: ```source ./venv/bin/activate```

```
pip install -r requirements.txt
cd spdb_backend
python manage.py migrate
python manage.py runserver
```


### FRONTEND:
```
cd frontend-do-you-know-da-wae
yarn install
yarn run dev
```

# How to run project each sequent time?

### DATABASE:
```cd database```

- On older version of docker compose
```docker-compose start```

- On new version of docker compose
```docker compose start```

aby zaktualizować nowe wersje funkcji należy uruchomić skrypt
```./update_sql.sh```

### BACKEND:
```cd backend```

- On Windows 10/11 system:
```.\venv\Scripts\Activate```

- On Linux system:
```source ./venv/bin/activate```

```cd spdb_backend```
```python manage.py runserver```

### FRONTEND:
```cd frontend-do-you-know-da-wae```
```yarn run dev```