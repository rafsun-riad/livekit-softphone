from django.urls import path

from .views import CurrentUserView, SearchUsersView

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="users-me"),
    path("search/", SearchUsersView.as_view(), name="users-search"),
]
