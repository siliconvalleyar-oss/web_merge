# Desarrollo

## Técnicas de Animación

El proyecto integra 5 capas de animación, cada una aprendida de un proyecto distinto:

### 1. CSS Puras — de `tienda_web_server`

| Técnica | Uso |
|---------|-----|
| `backdrop-filter: blur(20px)` | Navbar glassmorphism al hacer scroll |
| `radial-gradient` | Fondo con glow ambiental |
| `transition` | Hover effects en cards, botones, links |
| `@keyframes` | `rippleAnim`, `gridPulse`, `bounce`, `toastIn`/`toastOut` |
| `transform: translateY()` | Hover lift en cards y botones |

### 2. GSAP + ScrollTrigger — de `animation_web_skill`

```js
// Hero entrance con stagger
gsap.from('.hero-title', { y: 60, opacity: 0, duration: 1, delay: 0.3 });
gsap.from('.hero-desc', { y: 40, opacity: 0, duration: 0.8, delay: 0.5 });
gsap.from('.hero-actions a', {
  y: 30, opacity: 0, duration: 0.6, delay: 0.7, stagger: 0.15
});

// ScrollTrigger para revelar cards
gsap.utils.toArray('.service-card, .project-card').forEach((card, i) => {
  ScrollTrigger.create({
    trigger: card, start: 'top 85%',
    onEnter: () => gsap.to(card, { y: 0, opacity: 1, duration: 0.6, delay: i * 0.1 })
  });
  gsap.set(card, { y: 40, opacity: 0 });
});
```

### 3. AOS (Animate On Scroll) — de `animation_web_skill`

Atributo `data-aos` en HTML para animaciones declarativas:

```html
<div data-aos="fade-up" data-aos-delay="100">
```

Configuración:
- Duración: 600ms
- Easing: ease-out-cubic
- Once: true (solo una vez)
- Offset: 80px

### 4. Ripple Effect — de `animation_web_skill`

```js
btn.addEventListener('click', function (e) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  this.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});
```

```css
.ripple {
  position: absolute; border-radius: 50%;
  background: rgba(255,255,255,0.3);
  transform: scale(0); animation: rippleAnim 0.6s ease-out;
}
@keyframes rippleAnim { to { transform: scale(4); opacity: 0; } }
```

### 5. Custom Cursor — de `animation_web_skill`

Cursor circular que sigue al mouse con `mix-blend-mode: difference`. Se agranda al hover sobre elementos interactivos.

## Design Tokens — de `web_cursor`

Sistema centralizado con CSS custom properties en `:root`:

```css
:root {
  --color-primary: #6c5ce7;
  --color-accent: #00cec9;
  --text-4xl: clamp(2.5rem, 1.8rem + 2.5vw, 3.75rem);
  --space-8: 2rem;
  --shadow-glow: 0 0 30px rgba(108, 92, 231, 0.3);
  --radius-lg: 16px;
  --transition-base: 250ms ease;
}
```

Tipografía fluida con `clamp()`:
- `--text-xs`: `clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)`
- `--text-5xl`: `clamp(3rem, 2rem + 3.5vw, 5rem)`

## Dark / Light Theme

El tema se adapta automáticamente según `prefers-color-scheme`. En modo claro se invierten los valores de fondo, texto y sombras.

## Patrones JavaScript

### Toast Notifications

```js
window.showToast('Mensaje', 'success');
// Tipos: success, error, info
```

### Chatbot

Sistema de keyword matching con respuestas predefinidas:

```js
const chatbotResponses = {
  hola: '¡Hola! Bienvenido a WebMerge Studio.',
  precio: 'Nuestros proyectos parten desde $500 USD.',
  default: 'Gracias por tu mensaje. Te responderemos pronto.'
};
```

### Contadores Animados

Usa `IntersectionObserver` + `requestAnimationFrame` con easing cúbico:

```js
const eased = 1 - Math.pow(1 - progress, 3);
```

### Smooth Scroll

```js
anchor.addEventListener('click', (e) => {
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
```

## Responsive Design

| Breakpoint | Cambios |
|------------|---------|
| 1024px | Services/Projects: 4 col → 2 col |
| 768px | Stats: 4 col → 2 col, menú hamburguesa, cursor desactivado |
| 480px | Stats: 1 col, hero title reducido, chatbot full width |

## Accesibilidad

- `prefers-reduced-motion`: desactiva todas las animaciones
- `focus-visible`: outline accesible para navegación por teclado
- `.sr-only`: clase para lectores de pantalla
- `aria-label` en botones sin texto
- Contraste de color suficiente en ambos temas
