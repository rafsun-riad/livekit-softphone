from django.contrib import admin
from django.http import JsonResponse
from django.urls import path


def healthcheck(_request):
    return JsonResponse({"service": "backend", "status": "ok"})


urlpatterns = [
    path("api/health/", healthcheck, name="healthcheck"),
    path("admin/", admin.site.urls),
]
