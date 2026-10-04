from rest_framework import serializers
from .models import Usuario, Doctor, Enfermera, Paciente, Especialidad, Horario, Cita, SitioImagen

class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    foto_perfil_url = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'email', 'rol', 'telefono', 'foto_perfil', 'foto_perfil_url', 'fecha_nacimiento', 'is_superuser', 'is_staff']
        read_only_fields = ['id', 'is_superuser', 'is_staff']

    def get_foto_perfil_url(self, obj):
        """Retornar la URL completa de la foto de perfil o None si no existe"""
        if obj.foto_perfil:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto_perfil.url)
            return obj.foto_perfil.url
        return None

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        usuario = super().create(validated_data)
        if password:
            usuario.set_password(password)
            usuario.save()
        return usuario

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        usuario = super().update(instance, validated_data)
        if password:
            usuario.set_password(password)
            usuario.save()
        return usuario


class RegistroUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'rol', 'telefono']
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True},
            'telefono': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        usuario = Usuario.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', ''),
            rol=validated_data.get('rol', 'patient'),
            telefono=validated_data.get('telefono', '')
        )
        return usuario


class EspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidad
        fields = ['id', 'nombre', 'descripcion', 'tipo_especialidad', 'activo']
        read_only_fields = ['id']


class DoctorSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.filter(rol='doctor'),
        source='usuario',
        write_only=True
    )
    especialidad_nombre = serializers.SerializerMethodField()
    especialidad_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            'id', 'usuario', 'usuario_id', 
            'especialidad', 'especialidad_nombre', 'especialidad_detalle',
            'otra_especialidad', 'biografia'
        ]
        read_only_fields = ['id']

    def get_especialidad_nombre(self, obj):
        """Obtener nombre de especialidad, manejando caso None"""
        return obj.especialidad.nombre if obj.especialidad else None
    
    def get_especialidad_detalle(self, obj):
        """Obtener detalle de especialidad, manejando caso None"""
        if obj.especialidad:
            return EspecialidadSerializer(obj.especialidad).data
        return None
    
    def validate(self, data):
        """Validar que al menos una especialidad esté presente"""
        if not data.get('especialidad') and not data.get('otra_especialidad'):
            raise serializers.ValidationError("Debes seleccionar una especialidad o especificar 'otra especialidad'")
        return data


class EnfermeraSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.filter(rol='nurse'),
        source='usuario',
        write_only=True
    )
    especialidad_nombre = serializers.SerializerMethodField()
    especialidad_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Enfermera
        fields = [
            'id', 'usuario', 'usuario_id',
            'especialidad', 'especialidad_nombre', 'especialidad_detalle',
            'otra_especialidad', 'numero_licencia', 'biografia'
        ]
        read_only_fields = ['id']
    
    def get_especialidad_nombre(self, obj):
        """Obtener nombre de especialidad, manejando caso None"""
        return obj.especialidad.nombre if obj.especialidad else None
    
    def get_especialidad_detalle(self, obj):
        """Obtener detalle de especialidad, manejando caso None"""
        if obj.especialidad:
            return EspecialidadSerializer(obj.especialidad).data
        return None


class PacienteSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.filter(rol='patient'),
        source='usuario',
        write_only=True
    )

    class Meta:
        model = Paciente
        fields = [
            'id', 'usuario', 'usuario_id',
            'alergias', 'grupo_sanguineo',
            'contacto_emergencia', 'telefono_emergencia'
        ]
        read_only_fields = ['id']


class HorarioSerializer(serializers.ModelSerializer):
    doctor_nombre = serializers.CharField(source='doctor.usuario.get_full_name', read_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Horario
        fields = ['id', 'doctor', 'doctor_nombre', 'dia_semana', 'hora_inicio', 'hora_fin', 'activo']
        read_only_fields = ['id']

    def validate(self, data):
        if data['hora_fin'] <= data['hora_inicio']:
            raise serializers.ValidationError("La hora de fin debe ser después de la hora de inicio")
        return data




# Serializer usado para obtener tokens permitiendo login con email/telefono o usuario
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.core.exceptions import MultipleObjectsReturned


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # `username` field may contain username, email or telefono
        identifier = attrs.get('username', '').strip()
        password = attrs.get('password')
        user = None

        if identifier and password:
            user = authenticate(username=identifier, password=password)
            if not user:
                # buscar por email (único, no vacío)
                try:
                    u = Usuario.objects.get(email=identifier)
                    user = authenticate(username=u.username, password=password)
                except (Usuario.DoesNotExist, MultipleObjectsReturned):
                    pass
            if not user:
                # buscar por telefono
                try:
                    u = Usuario.objects.get(telefono=identifier)
                    user = authenticate(username=u.username, password=password)
                except (Usuario.DoesNotExist, MultipleObjectsReturned):
                    pass

        if not user:
            raise serializers.ValidationError('No existe una cuenta activa con las credenciales proporcionadas')

        attrs['username'] = user.username
        data = super().validate(attrs)
        return data


class CitaSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source='paciente.usuario.get_full_name', read_only=True, required=False, allow_null=True)
    doctor_nombre = serializers.CharField(source='doctor.usuario.get_full_name', read_only=True, required=False, allow_null=True)
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=Doctor.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Cita
        fields = [
            'id', 'paciente', 'paciente_nombre',
            'doctor', 'doctor_nombre',
            'fecha', 'hora', 'duracion_minutos', 'estado', 'motivo', 'notas_adicionales',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

    def get_validators(self):
        """Override to remove UniqueTogetherValidator since we handle it in validate()
        
        This is necessary to support partial updates where not all fields are provided.
        The validate() method handles the uniqueness check with proper fallback to instance values.
        """
        validators = super().get_validators()
        # Remove UniqueTogetherValidator to avoid conflict with custom validation
        return [v for v in validators if not isinstance(v, serializers.UniqueTogetherValidator)]

    def validate(self, data):
        from datetime import datetime, time, date
        # Solo validar si se proporcionan doctor, fecha y hora
        doctor = data.get('doctor')
        fecha = data.get('fecha')
        hora = data.get('hora')

        # Si alguno de los campos no está presente, usar el valor de la instancia existente
        if self.instance:
            if doctor is None:
                doctor = self.instance.doctor
            if fecha is None:
                fecha = self.instance.fecha
            if hora is None:
                hora = self.instance.hora

        # Solo validar si tenemos todos los campos necesarios
        if doctor and fecha and hora:
            instance_id = self.instance.id if self.instance else None

            # 1. Validar que no exista cita duplicada (solo estados activos)
            citas_existentes = Cita.objects.filter(
                doctor=doctor,
                fecha=fecha,
                hora=hora,
                estado__in=['pendiente', 'confirmada'],
            ).exclude(id=instance_id)

            if citas_existentes.exists():
                raise serializers.ValidationError("Ya existe una cita para este doctor en esa fecha y hora")

            # 2b. Validar solapamiento con duración
            from datetime import timedelta, datetime as dt_class
            DURACION_DEFAULT = 30
            duracion = data.get('duracion_minutos', getattr(self.instance, 'duracion_minutos', DURACION_DEFAULT) if self.instance else DURACION_DEFAULT)

            inicio_nueva = dt_class.combine(fecha, hora)
            fin_nueva = inicio_nueva + timedelta(minutes=duracion)

            citas_solapadas = Cita.objects.filter(
                doctor=doctor,
                fecha=fecha,
                estado__in=['pendiente', 'confirmada'],
            ).exclude(id=instance_id)

            for c in citas_solapadas:
                inicio_existente = dt_class.combine(c.fecha, c.hora)
                fin_existente = inicio_existente + timedelta(minutes=c.duracion_minutos)
                if inicio_nueva < fin_existente and inicio_existente < fin_nueva:
                    raise serializers.ValidationError({
                        'hora': f'Se solapa con la cita existente de {c.hora.strftime("%H:%M")} ({c.duracion_minutos}min).'
                    })


            # 2. Validar que la fecha/hora estén dentro de los horarios activos del doctor para ese día
            dia_semana = fecha.weekday()  # 0=Lunes, 6=Domingo
            horarios_del_dia = Horario.objects.filter(
                doctor=doctor,
                dia_semana=dia_semana,
                activo=True
            )

            if not horarios_del_dia.exists():
                raise serializers.ValidationError("El doctor no atiende en este día de la semana")

            # Verificar que la hora esté dentro de al menos un horario
            hora_time = hora if isinstance(hora, time) else datetime.strptime(hora, '%H:%M').time()
            en_horario = False
            for horario in horarios_del_dia:
                if horario.hora_inicio <= hora_time < horario.hora_fin:
                    en_horario = True
                    break

            if not en_horario:
                raise serializers.ValidationError("La hora seleccionada no está dentro del horario de atención del doctor")

            # 3. Validar que no sea en el pasado (si es hoy)
            if fecha == date.today():
                ahora = datetime.now().time()
                if hora_time <= ahora:
                    raise serializers.ValidationError("No se pueden agendar citas en horas pasadas")

        return data
    
    def update(self, instance, validated_data):
        """Sobrescribir update para manejar correctamente la actualización"""
        # Actualizar los campos de la instancia
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # Run model validation before saving
        # Exclude fields that are not being updated to avoid validation errors
        # on required fields that are not present in partial updates
        exclude_fields = [f for f in validated_data.keys()]
        instance.full_clean(exclude=exclude_fields)
        instance.save()
        return instance


class SitioImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = SitioImagen
        fields = ['id', 'titulo', 'descripcion', 'imagen', 'tipo', 'orden', 'activo', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']
