// Espera a que todo el contenido del DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // ================== ANUNCIO FLOTANTE ==================
    const anuncioFlotante = document.getElementById('anuncio-flotante');

    if (anuncioFlotante) {
        // Mostrar el anuncio después de 10 segundos
        setTimeout(() => {
            // Añade la clase que dispara la animación CSS (fade-in-slide-right)
            anuncioFlotante.classList.add('anuncio-visible');
        }, 10000); // 10000 ms = 10 segundos
    }
    
    // ================== SECCIÓN MODAL (PRESUPUESTO) ==================

    // Selección de elementos del DOM
    const budgetButton = document.getElementById('budget-button');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const modalQuestion = document.getElementById('modal-question');
    const modalInput = document.getElementById('modal-input');
    const modalFinalText = document.getElementById('modal-final-text');
    const modalNextButton = document.getElementById('modal-next-button');
    const alertPopup = document.getElementById('alert-popup');

    // Datos del formulario
    const questions = [
        "¿Cuál es su nombre?",
        "¿Cuál es la dirección donde se solicita el servicio?",
        "¿Cuenta de e-mail que pueda proporcionarnos para contactar con usted?",
        "¿Tiene un número de teléfono de casa u oficina que pueda proporcionarnos?",
        "¿Tiene un número de telefonía celular que pueda proporcionarnos?",
        "¿Cuál de nuestros servicios es el que requiere?"
    ];

    const variables = ["Nom", "Dir", "Mail", "Tel", "Cel", "serv"];
    let answers = {};
    let currentQuestionIndex = 0;

    // --- Funciones del Modal ---

    function openModal() {
        currentQuestionIndex = 0;
        answers = {};
        modalOverlay.style.display = 'flex';
        showQuestion(currentQuestionIndex);
    }

    function closeModal() {
        modalOverlay.style.display = 'none';
    }

    function showAlert(message) {
        alertPopup.querySelector('p').textContent = message;
        alertPopup.style.display = 'block';
        
        // Ocultar automáticamente después de 4 segundos
        setTimeout(() => {
            alertPopup.style.display = 'none';
        }, 4000);
    }

    function validateInput(index, value) {
        // Validación de campo vacío (para todas las preguntas)
        if (!value.trim()) {
            showAlert("Por favor, introduzca los datos requeridos.");
            return false;
        }
        
        // Validación de E-mail (pregunta 2)
        if (index === 2) { 
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                showAlert("Por favor, introduzca un e-mail válido.");
                return false;
            }
        }
        
        // Validación de Teléfono (preguntas 3 y 4)
        if (index === 3 || index === 4) {
            // Permite números, espacios, guiones y ( )
            const phoneRegex = /^[\d\s\-\(\)]+$/; 
            if (!phoneRegex.test(value)) {
                showAlert("Por favor, introduzca un número de teléfono válido.");
                return false;
            }
        }
        
        return true;
    }

    function showQuestion(index) {
        if (index < questions.length) {
            // Muestra la pregunta actual
            modalQuestion.textContent = questions[index];
            modalInput.value = '';
            modalInput.type = (index === 2) ? 'email' : (index === 3 || index === 4) ? 'tel' : 'text';
            modalInput.style.display = 'block';
            modalFinalText.style.display = 'none';
            modalNextButton.textContent = 'Siguiente';
            modalInput.focus();
        } else {
            // Muestra el mensaje final
            modalQuestion.textContent = 'Gracias.';
            modalInput.style.display = 'none';
            modalFinalText.textContent = 'Presione Enviar para solicitar un presupuesto';
            modalFinalText.style.display = 'block';
            modalNextButton.textContent = 'Enviar';
        }
    }

    function handleNextClick() {
        if (currentQuestionIndex < questions.length) {
            // Estamos respondiendo preguntas
            const value = modalInput.value;
            
            // Validar
            if (!validateInput(currentQuestionIndex, value)) {
                return; // Detiene si la validación falla
            }
            
            // Guardar respuesta
            const varName = variables[currentQuestionIndex];
            answers[varName] = value;
            
            // Pasar a la siguiente pregunta
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
            
        } else {
            // Estamos en el botón "Enviar"
            generateAndSendEmail();
            closeModal();
        }
    }

    function generateAndSendEmail() {
        // Construir el cuerpo del correo
        const body = `Hola mi nombre es ${answers.Nom} y solicito una cotizacion para ${answers.serv} en ${answers.Dir}.
Pueden contactarme al numero de telefono ${answers.Tel}, a mi numero de telefono movil que es ${answers.Cel} o a mi correo electronico ${answers.Mail}.

Espero su respuesta con la confirmacion y la fecha que ira el ingeniero a inspeccionar el terreno.
Gracias.`;

        const email = "serco.mxli@gmail.com";
        const subject = "Solicitud de Cotización";
        
        // Crear el enlace mailto
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Abrir el cliente de correo
        window.location.href = mailtoLink;
    }

    // --- Asignación de Eventos (Listeners) ---

    // Abrir modal
    budgetButton.addEventListener('click', openModal);
    
    // Cerrar modal al hacer clic fuera
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Botón Siguiente/Enviar
    modalNextButton.addEventListener('click', handleNextClick);
    
    // Permitir "Enter" en el input
    modalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleNextClick();
        }
    });


    // ================== SECCIÓN CARRUSEL ==================

    function initCarousel() {
        const track = document.querySelector('.carousel-track');
        if (!track) return; // Salir si no existe el carrusel
        
        const totalSlides = 50;
        let slideIndex = 0;
        
        // **ARRAY para guardar solo las diapositivas que cargan bien**
        const loadedSlides = []; 

        // Generar los slides dinámicamente
        for (let i = 1; i <= totalSlides; i++) {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            
            const img = document.createElement('img');
            img.src = `fotos/${i}.jpg`;
            img.alt = `Trabajo Reciente ${i}`;
            
            // Usamos una promesa para esperar la carga o el error
            new Promise((resolve) => {
                img.onload = () => {
                    slide.appendChild(img);
                    // Agregamos el slide solo si cargó
                    loadedSlides.push(slide); 
                    track.appendChild(slide);
                    resolve();
                };
                
                img.onerror = () => {
                    // Si falla, solo resolvemos sin agregar el slide
                    resolve(); 
                };
            });
        }
        
        // Damos un tiempo corto para que todas las 50 peticiones de imágenes se resuelvan
        setTimeout(() => {
            const activeSlidesCount = loadedSlides.length;

            // Si no hay imágenes que cargar, ¡no hacemos nada!
            if (activeSlidesCount === 0) return; 
            
            // Ajustar el tamaño del track para que solo contenga las diapositivas cargadas
            track.style.width = `${activeSlidesCount * 100}%`;

            // Establecer el ancho de cada diapositiva real
            loadedSlides.forEach(s => {
                s.style.minWidth = `${100 / activeSlidesCount}%`;
            });
            
            // Iniciar el intervalo solo si hay imágenes
            setInterval(() => {
                // Calcula el nuevo índice. El módulo usa SOLO la cuenta real de diapositivas cargadas
                slideIndex = (slideIndex + 1) % activeSlidesCount;
                
                // Mueve la pista. (slideIndex * 100 / activeSlidesCount) calcula el porcentaje
                // que hay que mover para la diapositiva actual.
                track.style.transform = `translateX(-${slideIndex * (100 / activeSlidesCount)}%)`;
                
            }, 8000); // Intervalo de 8 segundos
            
        }, 100); // Pequeña pausa de 100ms para asegurar que las 50 peticiones terminen
    }

    // Iniciar el carrusel
    initCarousel();

});

