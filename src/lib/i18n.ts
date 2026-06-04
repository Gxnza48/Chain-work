import { useLangStore, type Lang } from '@/store/lang';

export type { Lang };

/**
 * ChainWork i18n.
 *
 * Strategy: the English source string is the key. The `es` map below holds the
 * Spanish (LATAM) translation for each. When the language is English we return
 * the key verbatim; when Spanish we look it up and fall back to the key if it's
 * missing. That means a missing translation degrades to readable English rather
 * than a blank or a broken layout — the page can never break.
 *
 * Brand / structural terms are intentionally kept untranslated inside the
 * Spanish strings: "ChainWork", "chain"/"chains", "Dashboard", "Roadmap".
 */
const es: Record<string, string> = {
  // ---- Navbar / shared nav ----
  'How it works': 'Cómo funciona',
  'Features': 'Funciones',
  'FAQ': 'Preguntas frecuentes',
  'Log in': 'Iniciar sesión',
  'Sign Up': 'Crear cuenta',
  'Go to dashboard': 'Ir al dashboard',
  'Open menu': 'Abrir menú',
  'Close menu': 'Cerrar menú',
  'Open navigation': 'Abrir navegación',
  'Close navigation': 'Cerrar navegación',

  // ---- Footer ----
  'Product': 'Producto',
  'Company': 'Empresa',
  'Privacy': 'Privacidad',
  'Terms': 'Términos',
  'Ready to build together?': '¿Listos para construir juntos?',
  'Spin up a chain, share the code, and start shipping with your team in minutes.':
    'Creá una chain, compartí el código y empezá a trabajar con tu equipo en minutos.',
  'Open dashboard': 'Abrir dashboard',
  'Get started free': 'Empezá gratis',
  'A web app where small teams build together, in shared chains.':
    'Una app web donde equipos chicos construyen juntos, en chains compartidas.',
  'Star on GitHub': 'Dale una estrella en GitHub',
  'Made in Argentina by Gonzalo Bonadeo & Agustin Casal':
    'Hecho en Argentina por Gonzalo Bonadeo & Agustin Casal',

  // ---- Hero ----
  'Build together in shared chains.': 'Construyan juntos en chains compartidas.',
  'Now in beta · realtime collaboration': 'Ahora en beta · colaboración en tiempo real',
  "A web app where small teams build together, in shared chains. Between Notion's flexibility and Linear's structure — clean, fast, modern.":
    'Una app web donde equipos chicos construyen juntos, en chains compartidas. Entre la flexibilidad de Notion y la estructura de Linear: limpio, rápido y moderno.',
  'Get Started Free': 'Empezá gratis',
  'See how it works': 'Mirá cómo funciona',
  'Workspace': 'Espacio',
  'Projects': 'Proyectos',
  'Ideas': 'Ideas',
  'All Todos': 'Todas las tareas',
  'Members': 'Miembros',
  'Wire up auth guard': 'Conectar el auth guard',
  'Design members panel': 'Diseñar panel de miembros',
  'Plan launch tweet': 'Planear el tweet de lanzamiento',

  // ---- HowItWorks ----
  'Three steps. No setup tax.': 'Tres pasos. Sin complicaciones de configuración.',
  'ChainWork is built around one idea: shared spaces that are trivial to create and instant to join.':
    'ChainWork se basa en una sola idea: espacios compartidos fáciles de crear y de unirse al instante.',
  'Create a chain': 'Creá una chain',
  'Spin up a private workspace in seconds. We hand you a unique 8-character code — no settings to wrestle with.':
    'Creá un espacio privado en segundos. Te damos un código único de 8 caracteres, sin configuraciones complicadas.',
  'Invite your team': 'Invitá a tu equipo',
  'Share the code. Teammates join instantly, see the same projects, todos, and ideas in real time.':
    'Compartí el código. Tus compañeros se unen al instante y ven los mismos proyectos, tareas e ideas en tiempo real.',
  'Build together': 'Construyan juntos',
  'Plan with projects, capture ideas, knock out todos, and ship — with presence baked in so you know who is around.':
    'Planeá con proyectos, capturá ideas, completá tareas y entregá, con presencia integrada para saber quién está conectado.',

  // ---- Features ----
  "What's inside": 'Qué incluye',
  'Just the shape of work — nothing extra.': 'Solo la forma del trabajo, nada de más.',
  'Chains, members, projects, todos, ideas, attachments, presence. We made deliberate choices about what not to build.':
    'Chains, miembros, proyectos, tareas, ideas, adjuntos y presencia. Elegimos a conciencia qué no construir.',
  'Real-time presence': 'Presencia en tiempo real',
  'See teammates land in a chain the moment they arrive. Built on a single presence channel — never polled.':
    'Mirá a tus compañeros entrar a una chain en el momento. Funciona con un único canal de presencia, sin sondeos.',
  'Projects & Roadmap': 'Proyectos y Roadmap',
  'Up to 25 projects per chain. Completed todos automatically flow into an append-only Roadmap.':
    'Hasta 25 proyectos por chain. Las tareas completadas pasan automáticamente a un Roadmap que solo crece.',
  'Ideas board': 'Tablero de ideas',
  'Capture loose thoughts with rich text. Vote them up or down — one vote per teammate, changeable.':
    'Capturá ideas sueltas con texto enriquecido. Votá a favor o en contra: un voto por persona, modificable.',
  'Smart todos': 'Tareas inteligentes',
  'Pending, in progress, done — with drag-and-drop reordering and assignees that map to your chain.':
    'Pendiente, en progreso, hecho, con reordenamiento arrastrando y responsables de tu chain.',
  'Link & media attachments': 'Adjuntos de links y media',
  'Repos, images, videos, and links — each detected and shown with the right preview.':
    'Repos, imágenes, videos y links: cada uno detectado y mostrado con la vista previa correcta.',

  // ---- FAQ ----
  'Honest answers.': 'Respuestas honestas.',
  'What is a chain?': '¿Qué es una chain?',
  'A chain is a shared workspace. Every chain has a unique 8-character code; share the code and your teammates land in the same projects, todos, ideas, and attachments as you — with realtime presence.':
    'Una chain es un espacio compartido. Cada chain tiene un código único de 8 caracteres; compartí el código y tus compañeros entran a los mismos proyectos, tareas, ideas y adjuntos que vos, con presencia en tiempo real.',
  'Is there a free tier?': '¿Hay un plan gratis?',
  'Beta is free for everyone. We will share pricing well before turning anything on — and grandfather early users.':
    'La beta es gratis para todos. Vamos a avisar los precios con tiempo antes de activar nada, y los primeros usuarios mantienen sus condiciones.',
  'How is this different from Notion or Linear?': '¿En qué se diferencia de Notion o Linear?',
  'Notion is flexible but unstructured; Linear is rigid but task-shaped. ChainWork is a small, opinionated middle: chains for context, projects for scope, todos for execution, ideas for thinking out loud. Nothing else.':
    'Notion es flexible pero sin estructura; Linear es rígido y orientado a tareas. ChainWork es un punto medio chico y con criterio: chains para el contexto, proyectos para el alcance, tareas para ejecutar e ideas para pensar en voz alta. Nada más.',
  "Can I invite people who don't have an account?": '¿Puedo invitar a gente que no tiene cuenta?',
  'Yes. Anyone can sign up free in under a minute and then enter the chain code to join.':
    'Sí. Cualquiera puede crear una cuenta gratis en menos de un minuto y después ingresar el código de la chain para unirse.',
  'How does realtime presence work?': '¿Cómo funciona la presencia en tiempo real?',
  'When you open a chain we join a single presence channel. The members panel updates instantly when teammates come and go — no polling, no extra writes to the database.':
    'Cuando abrís una chain nos conectamos a un único canal de presencia. El panel de miembros se actualiza al instante cuando alguien entra o sale, sin sondeos ni escrituras extra en la base de datos.',
  'Can I delete a completed todo?': '¿Puedo borrar una tarea completada?',
  'No. Completed todos become part of the project Roadmap — an append-only history of what your team shipped. You can re-open one to move it back to pending or in_progress.':
    'No. Las tareas completadas pasan a formar parte del Roadmap del proyecto, un historial que solo crece de lo que tu equipo entregó. Podés reabrir una para volverla a pendiente o en progreso.',
  'Is my data private?': '¿Mis datos son privados?',
  'Yes. Every table has row-level security. Only members of a chain can read or write its rows — verified with policies, not just app logic.':
    'Sí. Cada tabla tiene seguridad a nivel de fila. Solo los miembros de una chain pueden leer o escribir sus filas, verificado con políticas, no solo con lógica de la app.',

  // ---- Auth ----
  'Loading…': 'Cargando…',
  'Login': 'Iniciar sesión',
  'Register': 'Registrarse',
  'or': 'o',
  'Sign in with Google': 'Iniciar sesión con Google',
  'Sign up with Google': 'Registrarse con Google',
  'Continue with Google': 'Continuar con Google',
  'Could not start Google sign-in': 'No se pudo iniciar el acceso con Google',
  'New to ChainWork?': '¿Sos nuevo en ChainWork?',
  'Create an account': 'Creá una cuenta',
  'Already on ChainWork?': '¿Ya tenés ChainWork?',
  'Sign in': 'Iniciar sesión',

  // ---- LoginForm ----
  'Enter a valid email': 'Ingresá un email válido',
  'Required': 'Obligatorio',
  'Sign in failed': 'No se pudo iniciar sesión',
  'Welcome back': 'Bienvenido de nuevo',
  'Enter your email above first': 'Primero ingresá tu email arriba',
  'Could not send reset email': 'No se pudo enviar el email de recuperación',
  'Reset link sent': 'Enlace de recuperación enviado',
  'Check {email}.': 'Revisá {email}.',
  'Email': 'Email',
  'Password': 'Contraseña',
  'Sending…': 'Enviando…',
  'Forgot password?': '¿Olvidaste tu contraseña?',
  'Hide password': 'Ocultar contraseña',
  'Show password': 'Mostrar contraseña',
  'Signing you in…': 'Iniciando sesión…',

  // ---- RegisterForm ----
  'Lowercase letters/digits, 3-24 chars, no spaces': 'Minúsculas/dígitos, 3-24 caracteres, sin espacios',
  'Password is too weak (≥ 8 chars, mix of cases/digits)':
    'La contraseña es muy débil (≥ 8 caracteres, mezcla de mayúsculas/minúsculas/dígitos)',
  'Passwords do not match': 'Las contraseñas no coinciden',
  'That username is taken': 'Ese nombre de usuario ya está en uso',
  'Could not sign you up': 'No se pudo crear tu cuenta',
  'Confirm your email': 'Confirmá tu email',
  'We sent a link to {email}.': 'Te enviamos un enlace a {email}.',
  'Full name': 'Nombre completo',
  'Username': 'Nombre de usuario',
  'Confirm password': 'Confirmar contraseña',
  'Creating your account…': 'Creando tu cuenta…',
  'Create account': 'Crear cuenta',

  // ---- PasswordStrength ----
  'Empty': 'Vacía',
  'Weak': 'Débil',
  'Fair': 'Aceptable',
  'Good': 'Buena',
  'Strong': 'Fuerte',
  'Enter a password': 'Ingresá una contraseña',

  // ---- Dashboard ----
  'Your chains': 'Tus chains',
  'Shared workspaces you are a member of.': 'Espacios compartidos de los que sos miembro.',
  'Join Chain': 'Unirse a una chain',
  'Create New Chain': 'Crear nueva chain',
  'Refresh': 'Actualizar',
  'Create your first chain': 'Creá tu primera chain',
  'A chain is a shared workspace. Make one, invite a teammate, and start building.':
    'Una chain es un espacio compartido. Creá una, invitá a alguien y empezá a construir.',
  'Join with code': 'Unirse con código',
  'Create chain': 'Crear chain',

  // ---- ProfileCard ----
  'Display name cannot be empty': 'El nombre visible no puede estar vacío',
  'That link doesn’t look like a valid URL': 'Ese enlace no parece una URL válida',
  'Could not save profile': 'No se pudo guardar el perfil',
  'Profile saved': 'Perfil guardado',
  'Avatar must be an image': 'El avatar debe ser una imagen',
  'Upload failed': 'Falló la subida',
  'Could not save avatar': 'No se pudo guardar el avatar',
  'Avatar updated': 'Avatar actualizado',
  'Change avatar': 'Cambiar avatar',
  'Display name': 'Nombre visible',
  'A short bio…': 'Una bio corta…',
  'Website or portfolio link': 'Sitio web o enlace de portfolio',
  'Save': 'Guardar',
  'Cancel': 'Cancelar',
  'Edit': 'Editar',
  'Add a short bio to introduce yourself to teammates.':
    'Agregá una bio corta para presentarte a tu equipo.',

  // ---- ChainCard ----
  'member': 'miembro',
  'members': 'miembros',
  'active {time}': 'activa {time}',
  'no activity yet': 'sin actividad aún',

  // ---- CreateChainModal ----
  'Give your chain a name': 'Ponele un nombre a tu chain',
  'Session expired': 'La sesión expiró',
  'Please sign in again.': 'Por favor iniciá sesión de nuevo.',
  'Could not generate a unique chain code. Please try again.':
    'No se pudo generar un código único para la chain. Probá de nuevo.',
  'Could not create chain': 'No se pudo crear la chain',
  'Chain code copied!': '¡Código de la chain copiado!',
  'Share it with your team.': 'Compartilo con tu equipo.',
  'Copied to clipboard': 'Copiado al portapapeles',
  'Create a new chain': 'Crear una nueva chain',
  "Chains are shared workspaces. You'll get an 8-character code to invite teammates.":
    'Las chains son espacios compartidos. Vas a recibir un código de 8 caracteres para invitar a tu equipo.',
  'Chain name': 'Nombre de la chain',
  'Your chain is ready': 'Tu chain está lista',
  'Share this code with your team — anyone with it can join {name}.':
    'Compartí este código con tu equipo: cualquiera que lo tenga puede unirse a {name}.',
  'Copied': 'Copiado',
  'Copy code': 'Copiar código',
  'Open chain': 'Abrir chain',

  // ---- JoinChainModal ----
  'Codes are 8 characters': 'Los códigos tienen 8 caracteres',
  "That code doesn't match a chain": 'Ese código no corresponde a ninguna chain',
  'Joined chain': 'Te uniste a la chain',
  'Join a chain': 'Unirse a una chain',
  'Paste the 8-character code your teammate shared with you.':
    'Pegá el código de 8 caracteres que te compartió tu compañero.',
  'Chain code': 'Código de la chain',
  'Join': 'Unirse',

  // ---- AvatarCropModal ----
  'Adjust your photo': 'Ajustá tu foto',
  'Drag to reposition and zoom to frame it just right.':
    'Arrastrá para reubicar y hacé zoom para encuadrarla.',
  'Zoom': 'Zoom',
  'Drag the image to reposition': 'Arrastrá la imagen para reubicarla',
  'Save photo': 'Guardar foto',

  // ---- Settings / AppShell ----
  'Settings': 'Configuración',
  'Manage your profile and account.': 'Gestioná tu perfil y tu cuenta.',
  'Profile': 'Perfil',
  'Account': 'Cuenta',
  'Signed in as your ChainWork account.': 'Conectado con tu cuenta de ChainWork.',
  'Sign out': 'Cerrar sesión',
  'Logout': 'Cerrar sesión',

  // ---- Notifications ----
  'Notifications': 'Notificaciones',
  'Get a push when a teammate adds a todo, idea or file, joins the chain, or a todo is due.':
    'Recibí un aviso cuando alguien agrega un todo, idea o archivo, se une a la chain, o vence un todo.',
  "This browser doesn't support push notifications.":
    'Este navegador no soporta notificaciones push.',
  'Install the app to get notifications on iPhone':
    'Instalá la app para recibir notificaciones en iPhone',
  'Tap': 'Tocá',
  'then “Add to Home Screen”, open it from there, and come back.':
    'luego “Agregar a inicio”, abrila desde ahí y volvé.',
  'Notifications are on for this device.': 'Las notificaciones están activadas en este dispositivo.',
  'Turn off': 'Desactivar',
  'Enable notifications': 'Activar notificaciones',
  'Notifications are blocked. Allow them for this site in your browser settings.':
    'Las notificaciones están bloqueadas. Permitilas para este sitio en la configuración del navegador.',
  'Notifications are blocked': 'Las notificaciones están bloqueadas',
  'Allow notifications for this site in your browser settings.':
    'Permití las notificaciones para este sitio en la configuración del navegador.',
  'Notifications enabled': 'Notificaciones activadas',
  'Could not enable notifications': 'No se pudieron activar las notificaciones',
  'Notifications disabled': 'Notificaciones desactivadas',

  // ---- Chain page ----
  'Loading chain…': 'Cargando chain…',
  'All todos': 'Todas las tareas',
  'All chain todos': 'Todas las tareas de la chain',

  // ---- ChainHeader ----
  'Chain name cannot be empty': 'El nombre de la chain no puede estar vacío',
  'Could not rename chain': 'No se pudo renombrar la chain',
  'Chain renamed': 'Chain renombrada',
  'Leave this chain? You can rejoin with the code.':
    '¿Salir de esta chain? Podés volver a unirte con el código.',
  'Could not leave': 'No se pudo salir',
  'Left chain': 'Saliste de la chain',
  'Rename chain': 'Renombrar chain',
  'Back to dashboard': 'Volver al dashboard',
  'Dashboard': 'Dashboard',
  'Save name': 'Guardar nombre',
  'Cancel rename': 'Cancelar',
  'Double-click or right-click to rename': 'Doble clic o clic derecho para renombrar',
  'Open members': 'Abrir miembros',
  'Chain settings': 'Configuración de la chain',
  'Copy chain code': 'Copiar código de la chain',
  'Leave chain': 'Salir de la chain',

  // ---- MembersPanel / MemberProfileDialog ----
  'Could not promote': 'No se pudo promover',
  '{name} is now an owner': '{name} ahora es dueño',
  'Remove {name} from this chain?': '¿Quitar a {name} de esta chain?',
  'Could not remove member': 'No se pudo quitar al miembro',
  '{name} was removed': 'Se quitó a {name}',
  'Promote to owner': 'Promover a dueño',
  'Ban from chain': 'Expulsar de la chain',
  '{count} total': '{count} en total',
  ' · right-click to manage': ' · clic derecho para gestionar',
  'View profile': 'Ver perfil',
  'Owner': 'Dueño',
  'Last online {time}': 'Última vez {time}',
  'Online now': 'En línea ahora',
  'Online now · phone': 'En línea ahora · celular',
  'Online now · computer': 'En línea ahora · PC',
  'Online from a phone': 'En línea desde un celular',
  'Online from a computer': 'En línea desde una PC',
  'No members yet.': 'Todavía no hay miembros.',
  'You manage this chain': 'Vos gestionás esta chain',
  'No bio yet.': 'Todavía no hay bio.',

  // ---- TodoForm ----
  'Give the todo a title': 'Ponele un título a la tarea',
  'Could not save todo': 'No se pudo guardar la tarea',
  'Todo updated': 'Tarea actualizada',
  'Could not create todo': 'No se pudo crear la tarea',
  'What needs doing?': '¿Qué hay que hacer?',
  'Add a description (optional)': 'Agregá una descripción (opcional)',
  'Priority': 'Prioridad',
  'Assignee': 'Responsable',
  'Assignees': 'Responsables',
  'Assign to…': 'Asignar a…',
  'Unassigned': 'Sin asignar',
  'No members to assign yet.': 'Todavía no hay miembros para asignar.',
  '{n} assigned': '{n} asignados',
  'Due': 'Vence',
  'Save changes': 'Guardar cambios',
  'Add todo': 'Agregar tarea',
  // ---- todo nudge / bell ----
  'Remind assignees': 'Recordar a los responsables',
  'Reminder sent': 'Recordatorio enviado',
  'Already reminded recently': 'Ya se recordó hace poco',
  'Available in {h}h': 'Disponible en {h}h',
  'No one is assigned to this todo': 'Nadie está asignado a esta tarea',
  'Could not send reminder': 'No se pudo enviar el recordatorio',

  // ---- priority ----
  'Low': 'Baja',
  'Medium': 'Media',
  'High': 'Alta',
  'Critical': 'Crítica',

  // ---- TodoItem ----
  'Could not update todo': 'No se pudo actualizar la tarea',
  'Could not update priority': 'No se pudo actualizar la prioridad',
  'Completed todos cannot be deleted — re-open it first.':
    'Las tareas completadas no se pueden borrar; primero reabrila.',
  'Delete this todo?': '¿Borrar esta tarea?',
  'Could not delete': 'No se pudo borrar',
  'Priority: {label} — click to change': 'Prioridad: {label} — clic para cambiar',
  'In progress': 'En progreso',
  'Done': 'Hecho',
  'Edit todo': 'Editar tarea',
  'Delete todo': 'Borrar tarea',
  'Re-open todo': 'Reabrir tarea',
  'Mark as {status}': 'Marcar como {status}',
  'Drag to reorder': 'Arrastrar para reordenar',
  'pending': 'pendiente',
  'in progress': 'en progreso',
  'done': 'hecho',

  // ---- TodoList ----
  'Todos': 'Tareas',
  'Could not load todos': 'No se pudieron cargar las tareas',
  'Project todos': 'Tareas del proyecto',
  '{active} active · {done} done': '{active} activas · {done} hechas',
  'No todos here yet.': 'Todavía no hay tareas acá.',
  'Add the first one to kick this off.': 'Agregá la primera para arrancar.',
  'Pending': 'Pendientes',
  'Done (section)': 'Hechas',

  // ---- ProjectListView / CreateProjectModal ----
  'Could not load projects': 'No se pudieron cargar los proyectos',
  'Project limit reached': 'Se alcanzó el límite de proyectos',
  'A chain may hold up to 25 projects.': 'Una chain puede tener hasta 25 proyectos.',
  '{n} / {cap} used': '{n} / {cap} usados',
  'New project': 'Nuevo proyecto',
  'Spin up your first project': 'Creá tu primer proyecto',
  'Projects are bounded containers: todos, ideas, attachments, and an append-only Roadmap.':
    'Los proyectos son contenedores acotados: tareas, ideas, adjuntos y un Roadmap que solo crece.',
  'Could not create project': 'No se pudo crear el proyecto',
  'Project created': 'Proyecto creado',
  'Projects bundle todos, ideas, attachments, and a Roadmap. Each chain can hold up to 25.':
    'Los proyectos agrupan tareas, ideas, adjuntos y un Roadmap. Cada chain puede tener hasta 25.',
  'Name': 'Nombre',
  'e.g. Launch site': 'ej. Lanzar el sitio',
  'Description (optional)': 'Descripción (opcional)',
  'What is this project about?': '¿De qué trata este proyecto?',
  'Create': 'Crear',

  // ---- ProjectCard / ProjectView ----
  'Project name cannot be empty': 'El nombre del proyecto no puede estar vacío',
  'Could not rename project': 'No se pudo renombrar el proyecto',
  'Project renamed': 'Proyecto renombrado',
  'Rename project': 'Renombrar proyecto',
  'No description': 'Sin descripción',
  '{completed}/{total} completed': '{completed}/{total} completadas',
  'no contributors yet': 'sin colaboradores aún',
  'created {time}': 'creado {time}',
  'Could not save': 'No se pudo guardar',
  'Project saved': 'Proyecto guardado',
  'All projects': 'Todos los proyectos',
  'Project name': 'Nombre del proyecto',
  'Description': 'Descripción',
  'Links & Media': 'Links y media',

  // ---- Roadmap ----
  'Could not load the Roadmap': 'No se pudo cargar el Roadmap',
  'Could not reopen': 'No se pudo reabrir',
  'Re-opened, removed from Roadmap': 'Reabierta, quitada del Roadmap',
  'append-only history': 'historial que solo crece',
  'No completed todos yet. Knock one out and watch it land here.':
    'Todavía no hay tareas completadas. Completá una y va a aparecer acá.',

  // ---- IdeaCard / IdeaForm / IdeaList ----
  'Vote failed': 'No se pudo votar',
  'Delete this idea? This cannot be undone.': '¿Borrar esta idea? No se puede deshacer.',
  'Idea deleted': 'Idea borrada',
  'Upvote': 'Votar a favor',
  'Downvote': 'Votar en contra',
  'Delete idea': 'Borrar idea',
  'Give the idea a title': 'Ponele un título a la idea',
  'Could not save idea': 'No se pudo guardar la idea',
  'Title': 'Título',
  "What's the idea?": '¿Cuál es la idea?',
  'Sketch it out…': 'Esbozala…',
  'Describe the idea…': 'Describí la idea…',
  'Add idea': 'Agregar idea',
  'Could not load ideas': 'No se pudieron cargar las ideas',
  'Most voted': 'Más votadas',
  'Newest': 'Más nuevas',
  'Oldest': 'Más viejas',
  'No ideas yet.': 'Todavía no hay ideas.',
  'Capture a loose thought — your team can vote it up.':
    'Capturá una idea suelta: tu equipo puede votarla.',
  'Bold': 'Negrita',
  'Italic': 'Cursiva',
  'Bullet list': 'Lista',

  // ---- Attachments ----
  'Delete this attachment?': '¿Borrar este adjunto?',
  'Attachment removed': 'Adjunto eliminado',
  'Attachment': 'Adjunto',
  'Video': 'Video',
  'Unknown': 'Desconocido',
  'Open': 'Abrir',
  'Delete attachment': 'Borrar adjunto',
  'Close image': 'Cerrar imagen',
  'Repo': 'Repo',
  'Image': 'Imagen',
  'Link': 'Link',
  'Add attachment': 'Agregar adjunto',
  'Nothing attached yet.': 'Todavía no hay adjuntos.',
  "Drop a repo link, an image, a YouTube URL — whatever's useful.":
    'Pegá un link a un repo, una imagen, una URL de YouTube: lo que sirva.',
  "That doesn't look like a valid URL": 'Eso no parece una URL válida',
  'Could not add link': 'No se pudo agregar el link',
  'Video too large': 'El video es muy grande',
  'Max 50 MB — yours is {mb} MB': 'Máx 50 MB; el tuyo tiene {mb} MB',
  'Choose an image file': 'Elegí un archivo de imagen',
  'Choose a video file': 'Elegí un archivo de video',
  'Could not save attachment': 'No se pudo guardar el adjunto',
  'Link or repo': 'Link o repo',
  'Upload image': 'Subir imagen',
  'Upload video (≤50 MB)': 'Subir video (≤50 MB)',
  'Title (optional)': 'Título (opcional)',
  'What is this?': '¿Qué es esto?',
  'Add': 'Agregar',
  'Uploading…': 'Subiendo…',
  'JPG, PNG, GIF, or WebP.': 'JPG, PNG, GIF o WebP.',
  'MP4 or WebM up to 50 MB.': 'MP4 o WebM hasta 50 MB.',
  'Upload PDF / HTML': 'Subir PDF / HTML',
  'PDF (preview inline) or .html (opens in a new tab) up to 25 MB.':
    'PDF (vista previa integrada) o .html (se abre en una pestaña nueva) hasta 25 MB.',
  'Choose a PDF or HTML file': 'Elegí un archivo PDF o HTML',
  'File too large': 'El archivo es muy grande',
  'Max 25 MB — yours is {mb} MB': 'Máx 25 MB; el tuyo tiene {mb} MB',
  'View PDF': 'Ver PDF',
  'View HTML': 'Ver HTML',
  'PDF': 'PDF',
  'HTML': 'HTML',
  'Opens in a new tab': 'Se abre en una pestaña nueva',
  'Close': 'Cerrar',

  // ---- NotFound ----
  "That page doesn't exist.": 'Esa página no existe.',
  'Back home': 'Volver al inicio',

  // ---- Loading (shared) ----
  'Loading': 'Cargando',

  // ---- ThemeToggle / LanguageToggle ----
  'Switch to {theme} theme': 'Cambiar a tema {theme}',
  'light': 'claro',
  'dark': 'oscuro',
  'Switch to English': 'Cambiar a inglés',
  'Switch to Spanish': 'Cambiar a español',

  // ---- relativeTime ----
  'never': 'nunca',
  'just now': 'recién',
};

// ---- Project power-ups: command palette, shortcuts, stats, filters, export,
// templates & recents (added 2026-06-01). Merged via Object.assign so new keys
// can be added without risking duplicate-key collisions with the map above. ----
Object.assign(es, {
  // Command palette
  'Go to': 'Ir a',
  'Home page': 'Inicio',
  'Recent projects': 'Proyectos recientes',
  'Actions': 'Acciones',
  'Search chains, projects, actions…': 'Buscá chains, proyectos, acciones…',
  'Command palette': 'Paleta de comandos',
  'No results': 'Sin resultados',
  // Shortcuts dialog
  'Keyboard shortcuts': 'Atajos de teclado',
  'Move faster around ChainWork.': 'Movete más rápido por ChainWork.',
  'Open the command palette': 'Abrir la paleta de comandos',
  'Show this shortcuts help': 'Mostrar esta ayuda de atajos',
  'New todo (inside a project)': 'Nueva tarea (dentro de un proyecto)',
  'Focus the todo search': 'Ir al buscador de tareas',
  'Close any dialog or menu': 'Cerrar cualquier diálogo o menú',
  // Dashboard
  'Search or jump to anything…': 'Buscá o saltá a cualquier cosa…',
  'Jump back in': 'Retomá donde dejaste',
  'Open project': 'Abrir proyecto',
  // Project stats
  'Project overview': 'Resumen del proyecto',
  'complete': 'completado',
  '{n} overdue': '{n} vencidas',
  'Overdue': 'Vencidas',
  'Files': 'Archivos',
  'Open by priority:': 'Abiertas por prioridad:',
  // Project list: search + sort + pin
  'Search projects…': 'Buscar proyectos…',
  'Clear': 'Limpiar',
  'Sort: Recent': 'Orden: Recientes',
  'Sort: Name A–Z': 'Orden: Nombre A–Z',
  'Sort: Most complete': 'Orden: Más completos',
  'Sort: Most todos': 'Orden: Más tareas',
  'No projects match your search.': 'Ningún proyecto coincide con tu búsqueda.',
  'Unpin project': 'Dejar de fijar',
  'Pin project': 'Fijar proyecto',
  // Project export
  'Export': 'Exportar',
  'Copy summary': 'Copiar resumen',
  'Download Markdown': 'Descargar Markdown',
  'Download JSON': 'Descargar JSON',
  'Project exported': 'Proyecto exportado',
  'Project not found': 'No se encontró el proyecto',
  'Summary copied to clipboard': 'Resumen copiado al portapapeles',
  'Could not copy': 'No se pudo copiar',
  // Todo toolbar + bulk
  'Search todos…': 'Buscar tareas…',
  'Sort: Manual': 'Orden: Manual',
  'Sort: Priority': 'Orden: Prioridad',
  'Sort: Due date': 'Orden: Fecha límite',
  'Sort: Newest': 'Orden: Más nuevas',
  'Select': 'Seleccionar',
  'Only mine': 'Solo las mías',
  'Clear filters': 'Limpiar filtros',
  '{n} selected': '{n} seleccionadas',
  'Complete': 'Completar',
  'Reopen': 'Reabrir',
  'Bulk action failed': 'La acción masiva falló',
  'Marked as done': 'Marcadas como hechas',
  'Re-opened': 'Reabiertas',
  'Priority updated': 'Prioridad actualizada',
  'Completed todos cannot be deleted — re-open them first.':
    'Las tareas completadas no se pueden borrar — reabrilas primero.',
  'Delete {n} todos?': '¿Borrar {n} tareas?',
  'Deleted ({n} completed skipped)': 'Borradas ({n} completadas omitidas)',
  'Todos deleted': 'Tareas borradas',
  'No todos match your filters.': 'Ninguna tarea coincide con tus filtros.',
  // Todo item: due dates + more menu
  '{n}d overdue': 'vencida hace {n}d',
  'today': 'hoy',
  'in {n}d': 'en {n}d',
  'Could not duplicate': 'No se pudo duplicar',
  'Todo duplicated': 'Tarea duplicada',
  'More actions': 'Más acciones',
  'Duplicate': 'Duplicar',
  'Copy title': 'Copiar título',
  // Idea → todo
  'Convert to a todo': 'Convertir en tarea',
  'Converted to a todo': 'Convertida en tarea',
  'Find it in the Todos tab.': 'La encontrás en la pestaña Tareas.',
  // Project templates
  'Start from a template': 'Empezá desde una plantilla',
  'Blank': 'En blanco',
  'Sprint': 'Sprint',
  'Content': 'Contenido',
  'Bug triage': 'Bugs',
  'Empty': 'Vacío',
  '{n} starter todos': '{n} tareas iniciales',
  'Plan the sprint': 'Planificar el sprint',
  'Build the core': 'Construir el núcleo',
  'Test & QA': 'Pruebas y QA',
  'Ship & announce': 'Lanzar y anunciar',
  'Outline': 'Esquema',
  'First draft': 'Primer borrador',
  'Edit & review': 'Editar y revisar',
  'Publish': 'Publicar',
  'Reproduce the issue': 'Reproducir el problema',
  'Find the root cause': 'Encontrar la causa raíz',
  'Apply the fix': 'Aplicar el arreglo',
  'Verify & close': 'Verificar y cerrar',
});

// ---- Labels, Comments, Subtasks, Milestones & in-app Notifications
// (added 2026-06-01). Merged via Object.assign so new keys can't collide with
// duplicate-literal lint errors on the maps above. Keys already defined earlier
// (Add, Loading…, Unknown, Notifications, Done, Cancel, Due, Save changes,
// Clear, Close, Add a description (optional)) are intentionally not repeated. ----
Object.assign(es, {
  // Labels
  'Labels': 'Etiquetas',
  'Manage labels': 'Gestionar etiquetas',
  'Edit labels': 'Editar etiquetas',
  'New label name': 'Nombre de la etiqueta',
  'Pick a color': 'Elegí un color',
  'No labels yet. Create your first one above.': 'Todavía no hay etiquetas. Creá la primera arriba.',
  'No labels yet — create one': 'Todavía no hay etiquetas — creá una',
  'A label with that name already exists': 'Ya existe una etiqueta con ese nombre',
  'Could not create label': 'No se pudo crear la etiqueta',
  'Could not rename label': 'No se pudo renombrar la etiqueta',
  'Could not delete label': 'No se pudo eliminar la etiqueta',
  'Delete this label? It will be removed from all todos.': '¿Eliminar esta etiqueta? Se quitará de todas las tareas.',
  'Filter by label': 'Filtrar por etiqueta',
  'Rename': 'Renombrar',
  'Delete': 'Borrar',
  'blue': 'Azul',
  'emerald': 'Esmeralda',
  'amber': 'Ámbar',
  'rose': 'Rosa',
  'violet': 'Violeta',
  'slate': 'Pizarra',
  'cyan': 'Cian',
  'orange': 'Naranja',
  // Comments
  'Could not load comments': 'No se pudieron cargar los comentarios',
  'Could not post comment': 'No se pudo publicar el comentario',
  'Could not delete comment': 'No se pudo borrar el comentario',
  'No comments yet. Start the conversation.': 'Todavía no hay comentarios. Arrancá la conversación.',
  'Write a comment…': 'Escribí un comentario…',
  'Post comment': 'Publicar comentario',
  'Delete comment': 'Borrar comentario',
  'Toggle comments': 'Mostrar/ocultar comentarios',
  // Subtasks
  'Subtasks': 'Subtareas',
  'Add a subtask…': 'Agregar una subtarea…',
  'Mark subtask done': 'Marcar subtarea como hecha',
  'Mark subtask not done': 'Marcar subtarea como no hecha',
  'Delete subtask': 'Eliminar subtarea',
  'Could not load subtasks': 'No se pudieron cargar las subtareas',
  'Could not add subtask': 'No se pudo agregar la subtarea',
  'Could not update subtask': 'No se pudo actualizar la subtarea',
  'Could not delete subtask': 'No se pudo eliminar la subtarea',
  // Milestones
  'Milestones': 'Hitos',
  'goals & sprints': 'metas y sprints',
  'New milestone': 'Nuevo hito',
  'Add milestone': 'Agregar hito',
  'No milestones yet. Group todos into a goal or sprint to track progress.':
    'Todavía no hay hitos. Agrupá tareas en una meta o sprint para seguir el progreso.',
  'Milestone': 'Hito',
  'No milestone': 'Sin hito',
  'Milestone title (e.g. Beta launch)': 'Título del hito (ej. Lanzamiento beta)',
  'Give the milestone a title': 'Ponele un título al hito',
  'Milestone created': 'Hito creado',
  'Milestone updated': 'Hito actualizado',
  'Milestone deleted': 'Hito eliminado',
  'Milestone completed': 'Hito completado',
  'Milestone re-opened': 'Hito reabierto',
  'Could not create milestone': 'No se pudo crear el hito',
  'Could not save milestone': 'No se pudo guardar el hito',
  'Could not update milestone': 'No se pudo actualizar el hito',
  'Could not delete milestone': 'No se pudo eliminar el hito',
  'Delete this milestone? Linked todos are kept.': '¿Eliminar este hito? Las tareas vinculadas se conservan.',
  'Mark milestone done': 'Marcar hito como hecho',
  'Re-open milestone': 'Reabrir hito',
  'Edit milestone': 'Editar hito',
  'Delete milestone': 'Eliminar hito',
  'overdue': 'vencido',
  '{done}/{total}': '{done}/{total}',
  // In-app notifications
  'Mark all read': 'Marcar todo como leído',
  'No notifications yet': 'Todavía no hay notificaciones',
  'New comment': 'Nuevo comentario',
  'Todo completed': 'Tarea completada',
  'New member joined': 'Se unió un nuevo miembro',
});

// ---- Chain group chat (added 2026-06-01). ----
Object.assign(es, {
  'Chat': 'Chat',
  '{n} members': '{n} miembros',
  'Write a message…': 'Escribí un mensaje…',
  'Send': 'Enviar',
  'No messages yet. Say hi 👋': 'Todavía no hay mensajes. Saludá 👋',
  'Reply': 'Responder',
  'Copy': 'Copiar',
  'Replying to {name}': 'Respondiendo a {name}',
  'deleted message': 'mensaje eliminado',
  'edited': 'editado',
  'Message actions': 'Acciones del mensaje',
  'Delete this message?': '¿Borrar este mensaje?',
  'Could not send message': 'No se pudo enviar el mensaje',
  'Could not edit message': 'No se pudo editar el mensaje',
  'Could not delete message': 'No se pudo borrar el mensaje',
  'React': 'Reaccionar',
  'Something went wrong. Try reloading.': 'Algo salió mal. Probá recargar.',
  'Message info': 'Info del mensaje',
  'Information': 'Información',
  'Seen': 'Visto',
  'Not seen': 'No visto',
  'Project': 'Proyecto',
  'Attach a file': 'Adjuntar un archivo',
  'Could not send file': 'No se pudo enviar el archivo',
  'Copy image': 'Copiar imagen',
  'Image copied': 'Imagen copiada',
  'Could not copy image': 'No se pudo copiar la imagen',
  'Create poll': 'Crear votación',
  'Ask a question': 'Hacé una pregunta',
  'Option': 'Opción',
  'Add option': 'Agregar opción',
  '{n} votes': '{n} votos',
  'Could not create poll': 'No se pudo crear la votación',
  '{n} new messages': '{n} mensajes nuevos',
  'Add emoji': 'Agregar emoji',
  '{name} is typing…': '{name} está escribiendo…',
  'Several people are typing…': 'Varias personas están escribiendo…',
  'Download': 'Descargar',
});

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Translate a single key for a given language. Falls back to the key itself. */
export function translate(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const base = lang === 'en' ? key : es[key] ?? key;
  return interpolate(base, vars);
}

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Hook returning a translator bound to the current language. Subscribing to the
 * store means every component using `t` re-renders when the language toggles.
 */
export function useT(): TFn {
  const lang = useLangStore((s) => s.lang);
  return (key, vars) => translate(lang, key, vars);
}
