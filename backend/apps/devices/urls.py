from django.urls import path

from .views import DeviceDetailView, DeviceListView, DeviceRegisterView

urlpatterns = [
    path("", DeviceListView.as_view(), name="devices-list"),
    path("register/", DeviceRegisterView.as_view(), name="devices-register"),
    path("<uuid:device_id>/", DeviceDetailView.as_view(), name="devices-detail"),
]
