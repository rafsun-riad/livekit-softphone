from django.urls import path

from .views import (
    CallAcceptView,
    CallCancelView,
    CallCreateView,
    CallDetailView,
    CallEndView,
    CallJoinMediaView,
    CallRejectView,
)

urlpatterns = [
    path("", CallCreateView.as_view(), name="calls-create"),
    path("<uuid:call_id>/", CallDetailView.as_view(), name="calls-detail"),
    path("<uuid:call_id>/accept/", CallAcceptView.as_view(), name="calls-accept"),
    path("<uuid:call_id>/reject/", CallRejectView.as_view(), name="calls-reject"),
    path("<uuid:call_id>/cancel/", CallCancelView.as_view(), name="calls-cancel"),
    path("<uuid:call_id>/end/", CallEndView.as_view(), name="calls-end"),
    path(
        "<uuid:call_id>/join-media/",
        CallJoinMediaView.as_view(),
        name="calls-join-media",
    ),
]
