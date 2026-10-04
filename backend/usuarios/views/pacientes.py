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
    from django.db.models import Q, Count

    query = request.query_params.get('query', '').strip()

    if not query or len(query) < 2:
        return Response({'error': 'La búsqueda debe tener al menos 2 caracteres'}, status=400)

    # [FASE 7 §7.1.2] select_related + batch count para evitar N+1 en el loop
    usuarios_query = Usuario.objects.filter(
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(username__icontains=query),
        rol='patient'
    ).select_related('perfil_paciente')[:20]

    # Batch: obtener counts de pares (first_name, last_name) en 1 query
    name_counts = {}
    if usuarios_query:
        pares = (
            Usuario.objects
            .filter(rol='patient')
            .values('first_name', 'last_name')
            .annotate(count=Count('id'))
        )
        name_counts = {
            (p['first_name'], p['last_name']): p['count'] for p in pares
        }

    resultados = []
    for usuario in usuarios_query:
        nombre_completo = f"{usuario.first_name} {usuario.last_name}".strip()
        usuarios_mismo_nombre = name_counts.get(
            (usuario.first_name, usuario.last_name), 0
        )

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
