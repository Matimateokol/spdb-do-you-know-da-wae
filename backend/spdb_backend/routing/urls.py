from django.urls import path
from .views import RouteView, StreetView, BoundariesView

urlpatterns = [
    path("get_path/", RouteView.as_view(), name="get_path"),
    path("get_street/", StreetView.as_view(), name="get_street"),
    path("get_boundaries/", BoundariesView.as_view(), name="get_boundaries"),
]
