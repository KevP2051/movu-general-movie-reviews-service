# Movu General Movie Reviews Service

## Configuración de Base de Datos

### Variables de Entorno
Asegúrate de tener configurado el archivo `.env` con las siguientes variables:

```env
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_SCHEMA=
```

### Instalación de Dependencias
```powershell
npm install
```

### Comandos de Migraciones

#### Ejecutar todas las migraciones
La primera migración creará automáticamente el esquema si no existe:
```powershell
npm run db:migrate
```

**Nota**: Si usas Docker, asegúrate de que el contenedor de PostgreSQL esté ejecutándose antes de correr las migraciones.

#### Revertir la última migración
```powershell
npm run db:migrate:undo
```

#### Revertir todas las migraciones
```powershell
npm run db:migrate:undo:all
```

#### Crear una nueva migración
```powershell
npm run migration:generate -- nombre-de-la-migracion
```

### Comandos de Seeders

#### Ejecutar todos los seeders
```powershell
npm run db:seed
```

#### Revertir todos los seeders
```powershell
npm run db:seed:undo
```

#### Crear un nuevo seeder
```powershell
npm run seed:generate -- nombre-del-seeder
```

### Comandos de Base de Datos

#### Crear la base de datos
```powershell
npm run db:create
```

#### Eliminar la base de datos
```powershell
npm run db:drop
```

## Modelos

El proyecto incluye los siguientes modelos:
- **User**: Usuarios del sistema
- **Movie**: Películas
- **Genre**: Géneros de películas
- **MovieGenre**: Relación many-to-many entre películas y géneros
- **Review**: Reseñas de películas
- **People**: Personas (actores, directores, etc.)
- **Credits**: Créditos de películas (relación entre películas y personas)

## Ejecución

### Modo desarrollo
```powershell
npm run dev
```

### Modo producción
```powershell
npm start
```

## Notas Importantes

- Todas las tablas se crean en el esquema `general_movie_reviews_service` definido en el `.env`
- Las migraciones se ejecutan con Sequelize CLI y respetan la configuración del esquema
- Los modelos incluyen timestamps automáticos (createdAt, updatedAt)
