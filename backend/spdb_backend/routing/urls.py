from django.urls import path
from .views import RouteView

urlpatterns = [
    path("get_path/", RouteView.as_view(), name="get_path"),
]
