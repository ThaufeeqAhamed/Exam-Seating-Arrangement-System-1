from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView, UserViewSet, RoomViewSet,
    StudentViewSet, ExamViewSet, SeatingArrangementViewSet,
    TimetableViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'students', StudentViewSet)
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'seating-arrangements', SeatingArrangementViewSet)
router.register(r'timetables', TimetableViewSet, basename='timetable')


urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include(router.urls)),
    # The upload_master_list endpoint is registered automatically through the router
    # Access it at: /api/students/upload_master_list/
]
