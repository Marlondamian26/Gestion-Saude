"""
Vistas de pacientes: ViewSet + búsqueda de pacientes.
"""
import logging

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..models import Paciente, Usuario
from ..serializers import PacienteSerializer

logger = logging.getLogger(__name__)


class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def buscar_pacientes(request):
    """
    Endpoint para buscar pacientes por nombre, apellido o username.
    Parámetros: query (string).
    Devuelve: Lista de pacientes que coinciden con la búsqueda.
    """
    from django.db.models import Q

    query = request.query_params.get('query', '').strip()

    if not query or len(query) < 2:
        return Response({'error': 'La búsqueda debe tener al menos 2 caracteres'}, status=400)

    # Buscar en usuarios con rol patient que coincidan con nombre, apellido o username
    usuarios_query = Usuario.objects.filter(
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(username__icontains=query),
        rol='patient'
    ).select_related('perfil_paciente')[:20]

    resultados = []
    for usuario in usuarios_query:
        nombre_completo = f"{usuario.first_name} {usuario.last_name}".strip()

        # Determinar qué información mostrar
        usuarios_mismo_nombre = Usuario.objects.filter(
            rol='patient',
            first_name=usuario.first_name,
            last_name=usuario.last_name
        ).count()

        if usuarios_mismo_nombre > 1:
            display_text = f"{nombre_completo} (@{usuario.username})"
        else:
            display_text = nombre_completo

        resultados.append({
            'id': usuario.perfil_paciente.id,
            'username': usuario.username,
            'first_name': usuario.first_name,
            'last_name': usuario.last_name,
            'display_text': display_text,
            'foto_perfil': usuario.foto_perfil.url if usuario.foto_perfil else None
        })

    return Response({'resultados': resultados})
