from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def healthcheck(_request):
    return JsonResponse({"service": "backend", "status": "ok"})


urlpatterns = [
    path("api/health/", healthcheck, name="healthcheck"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/users/", include("apps.accounts.user_urls")),
    path("api/contacts/", include("apps.contacts.urls")),
    path("api/devices/", include("apps.devices.urls")),
    path("api/calls/", include("apps.calls.urls")),
    path("admin/", admin.site.urls),
]
