from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Notificacion
from .serializers import NotificacionSerializer, NotificacionUpdateSerializer

class IsOwner(permissions.BasePermission):
    """Permiso personalizado para que solo el dueño vea sus notificaciones"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        return obj.usuario == request.user

class NotificacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar notificaciones
    - Listar mis notificaciones
    - Marcar como leídas
    - Eliminar notificaciones
    """
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        """Cada usuario solo ve sus propias notificaciones"""
        return Notificacion.objects.filter(
            usuario=self.request.user
        ).select_related('usuario')
    
    @action(detail=False, methods=['post'])
    def marcar_todas_leidas(self, request):
        """Marca todas las notificaciones del usuario como leídas"""
        notificaciones = self.get_queryset().filter(leida=False)
        count = notificaciones.update(leida=True)
        
        return Response({
            'mensaje': f'{count} notificaciones marcadas como leídas',
            'count': count
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def marcar_leida(self, request, pk=None):
        """Marca una notificación específica como leída"""
        notificacion = self.get_object()
        notificacion.leida = True
        notificacion.save()
        
        serializer = self.get_serializer(notificacion)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def no_leidas(self, request):
        """Obtiene solo las notificaciones no leídas"""
        notificaciones = self.get_queryset().filter(leida=False)
        serializer = self.get_serializer(notificaciones, many=True)
        return Response({
            'count': notificaciones.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def ultimas(self, request):
        """Obtiene las últimas 10 notificaciones"""
        notificaciones = self.get_queryset()[:10]
        serializer = self.get_serializer(notificaciones, many=True)
        return Response(serializer.data)
    
    def perform_destroy(self, instance):
        """Al eliminar, podemos hacer alguna acción adicional si es necesario"""
        # Aquí podrías enviar un log o hacer algo antes de eliminar
        instance.delete() 