const strings = {
  es: {
    'nav.editorial':           'Editorial',
    'nav.sections':            'Secciones',
    'nav.about':               'Nosotros',
    'nav.contact':             'Contacto',
    'hero.tagline':            'Cannabis · Ciencia · Derechos Humanos',
    'hero.quote':              'Hablar de cannabis es hablar de derechos humanos: del derecho a la salud, a decidir sobre el propio cuerpo y a no ser criminalizados por buscar alivio y dignidad.',
    'hero.cta1':               'Leer Editorial',
    'hero.cta2':               'Explorar Secciones',
    'featured.label':          'Artículos Destacados',
    'sections.label':          'Nuestras Secciones',
    'newsletter.headline':     'Suscríbete',
    'newsletter.sub':          'Periodismo independiente sobre cannabis y plantas medicinales',
    'newsletter.btn':          'Suscribirse',
    'editorial.label':         'Editorial',
    'editorial.numero':        'Número',
    'editorial.fecha':         'Fecha',
    'editorial.edicion':       'Edición',
    'editorial.title':         'Carta a los Lectores',
    'editorial.firma':         '— La Redacción',
    'secciones.label':         'Nuestras Secciones',
    'secciones.articulos':     'Artículos',
    'nosotros.label':          'Nosotros',
    'nosotros.quienes':        'Quiénes somos',
    'nosotros.principios':     'Nuestros principios',
    'nosotros.p01.name':       'Independencia editorial',
    'nosotros.p02.name':       'Rigor científico',
    'nosotros.p03.name':       'Derechos humanos',
    'contacto.label':          'Contacto',
    'contacto.escribinos':     'Escribinos',
    'contacto.nombre':         'Nombre',
    'contacto.email':          'Email',
    'contacto.asunto':         'Asunto',
    'contacto.mensaje':        'Mensaje',
    'contacto.enviar':         'Enviar →',
  },
  en: {
    'nav.editorial':           'Editorial',
    'nav.sections':            'Sections',
    'nav.about':               'About',
    'nav.contact':             'Contact',
    'hero.tagline':            'Cannabis · Science · Human Rights',
    'hero.quote':              "Talking about cannabis is talking about human rights: the right to health, to decide about one's own body, and not to be criminalized for seeking relief and dignity.",
    'hero.cta1':               'Read Editorial',
    'hero.cta2':               'Explore Sections',
    'featured.label':          'Featured Articles',
    'sections.label':          'Our Sections',
    'newsletter.headline':     'Subscribe',
    'newsletter.sub':          'Independent journalism on cannabis and medicinal plants',
    'newsletter.btn':          'Subscribe',
    'editorial.label':         'Editorial',
    'editorial.numero':        'Issue',
    'editorial.fecha':         'Date',
    'editorial.edicion':       'Edition',
    'editorial.title':         'Letter to Our Readers',
    'editorial.firma':         '— The Editorial Team',
    'secciones.label':         'Our Sections',
    'secciones.articulos':     'Articles',
    'nosotros.label':          'About',
    'nosotros.quienes':        'Who we are',
    'nosotros.principios':     'Our principles',
    'nosotros.p01.name':       'Editorial independence',
    'nosotros.p02.name':       'Scientific rigor',
    'nosotros.p03.name':       'Human rights',
    'contacto.label':          'Contact',
    'contacto.escribinos':     'Write to us',
    'contacto.nombre':         'Name',
    'contacto.email':          'Email',
    'contacto.asunto':         'Subject',
    'contacto.mensaje':        'Message',
    'contacto.enviar':         'Send →',
  },
};

function applyLang(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (strings[lang]?.[key]) el.textContent = strings[lang][key];
  });
  document.querySelectorAll('.lang-toggle [data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  document.documentElement.lang = lang;
  localStorage.setItem('lang', lang);
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('lang') || 'es';
  applyLang(saved);

  document.querySelectorAll('.lang-toggle [data-lang]').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.getAttribute('data-lang')));
  });
});
