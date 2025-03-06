# SEMAH Store 🛍️

![SEMAH Store](./src/assets/semahLogo.png)

## 🚀 Descripción

SEMAH Store es una plataforma de comercio electrónico moderna y robusta desarrollada con tecnologías de vanguardia. Diseñada específicamente para la gestión y venta de equipos profesionales, ofrece una experiencia de usuario fluida y responsive.

## ✨ Características Principales

- 🎯 **Catálogo Dinámico**: Visualización y filtrado avanzado de productos
- 🛒 **Carrito de Compras**: Sistema de carrito persistente con gestión de estado
- 🌓 **Modo Oscuro**: Soporte completo para tema claro/oscuro
- 📱 **Diseño Responsive**: Experiencia optimizada en todos los dispositivos
- 🔍 **Búsqueda en Tiempo Real**: Búsqueda instantánea de productos
- 📧 **Notificaciones por Email**: Sistema automatizado de confirmación de reservas
- 💾 **Persistencia de Datos**: Base de datos PostgreSQL con Prisma ORM

## 🛠️ Tecnologías Utilizadas

- **Frontend**:
  - [Astro](https://astro.build/) - Framework web moderno
  - [React](https://reactjs.org/) - Biblioteca UI
  - [TailwindCSS](https://tailwindcss.com/) - Framework CSS
  - [Zustand](https://zustand-demo.pmnd.rs/) - Gestión de estado
  - [Radix UI](https://www.radix-ui.com/) - Componentes accesibles

- **Backend**:
  - [Prisma](https://www.prisma.io/) - ORM
  - [PostgreSQL](https://www.postgresql.org/) - Base de datos
  - [Resend](https://resend.com/) - Servicio de email

## 📦 Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/semahstore.git
   cd semahstore
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   ```
   Edita el archivo `.env` con tus credenciales:
   ```env
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/semahstore"
   RESEND_API_KEY="tu_api_key"
   ADMIN_EMAIL="admin@ejemplo.com"
   ```

4. **Inicializar la base de datos**:
   ```bash
   npx prisma migrate dev
   npm run import-devices
   ```

5. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

## 🚀 Despliegue

Para construir la aplicación para producción:

```bash
npm run build
```

Los archivos de la build se generarán en el directorio `dist/`.

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run import-devices` - Importa datos de dispositivos
- `npm run astro` - Ejecuta comandos de Astro CLI

## 🔐 Seguridad

- Validación de stock en tiempo real
- Protección contra desbordamiento de carrito
- Sanitización de datos de entrada
- Variables de entorno seguras

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo

- Desarrollado por Roberto J. Vargas
- Contacto: rvargas@rv-solutions.net

## 🌟 Agradecimientos

- [Astro](https://astro.build/) por el excelente framework
- [Vercel](https://vercel.com/) por el hosting
- [TailwindCSS](https://tailwindcss.com/) por el sistema de diseño
- La comunidad open source por sus invaluables contribuciones

---

Desarrollado con ❤️ por Roberto J. Vargas
(https://semah.com)
