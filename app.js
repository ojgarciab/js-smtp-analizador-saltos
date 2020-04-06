document.addEventListener('DOMContentLoaded', () => {
    /* Precargamos los elementos por "id" */
    let smtp = document.getElementById('smtp');
    let analizar = document.getElementById('analizar');
    /* Cada vez que cambie "smtp" actualizamos su valor para su restauración */
    smtp.addEventListener('change', () => {
        localStorage.setItem('smtp', smtp.value);
    });
    /* Cada vez que pulsemos en el botón analizamos las cabeceras */
    analizar.addEventListener('click', () => {
        /* Patrón de búsqueda de cabeceras y sus partes */
        let cabeceraRegexp = /^(Date|Received):[\s]+(.*)$/i;
        let receivedFromRegexp = /from ([^\s]+)/i;
        let receivedByRegexp = /by ([^\s]+)/i;
        let receivedDateRegexp = /;?(?:.*,)[\s]*([^;]+)$/i;
        /* Unimos las cabeceras multilínea */
        let cabeceras = smtp.value.replace(/[\n\r]+[\t ]+/mg, ' ').split('\n');
        /* Inicializamos los saltos con un conjunto vacío de datos */
        let saltos = {
            date: {
                elementos: [],
            },
            received: {
                elementos: [],
            }
        };
        cabeceras.forEach(cabecera => {
            let componentes = cabecera.match(cabeceraRegexp);
            if (componentes === null) return;
            let from = componentes[2].match(receivedFromRegexp);
            let by = componentes[2].match(receivedByRegexp);
            let date = componentes[2].match(receivedDateRegexp);
            saltos[componentes[1].toLowerCase()].elementos.unshift({
                cabecera: componentes[1].toLowerCase(),
                from: from ? from[1] : false,
                by: by ? by[1] : false,
                date: date ? new Date(date[1]) : false,
            });
        });
        /* Limpiamos la tabla */
        let tabla = document.querySelector('.table tbody');
        tabla.textContent = '';
        /* Inicialmente no hay hora anterior */
        let anterior = false;
        /* Concatenamos los datos y generamos las filas de la tabla */
        saltos.date.elementos.concat(saltos.received.elementos).forEach(elemento => {
            let tr = document.createElement('tr');
            let td = [
                document.createElement('td'),
                document.createElement('td'),
                document.createElement('td'),
                document.createElement('td'),
                document.createElement('td'),
            ];
            td[0].innerText = elemento.cabecera[0].toUpperCase() + elemento.cabecera.slice(1);
            td[1].innerText = elemento.from;
            td[2].innerText = elemento.by;
            td[3].innerText = elemento.date.toLocaleString();
            if (anterior === false) {
                td[4].innerText = '-';
            } else {
                td[4].dataset.latencia = (elemento.date.getTime() - anterior.getTime()) / 1000;
            }
            td.forEach(elemento => tr.appendChild(elemento));
            tabla.appendChild(tr);
            anterior = elemento.date;
        });
        /* Dependiendo de la latencia cambiamos el color de la fila */
        document.querySelectorAll('td[data-latencia]').forEach(elemento => {
            elemento.innerText = elemento.dataset.latencia + "s";
            if (elemento.dataset.latencia < 10) {
                elemento.parentNode.style.color = 'darkgreen';
            } else if (elemento.dataset.latencia < 60) {
                elemento.parentNode.style.color = 'green';
            } else {
                if (elemento.dataset.latencia < 120) {
                    elemento.parentNode.style.color = 'darkorange';
                } else if (elemento.dataset.latencia < 300) {
                    elemento.parentNode.style.color = 'darkred';
                } else {
                    elemento.parentNode.style.color = 'red';
                }
                elemento.innerText = Math.floor(elemento.dataset.latencia / 60) + "m" + (elemento.dataset.latencia % 60) + "s";
            }
        });
    });
    /* Restauramos el valor previo del campo "smtp" y pulsamos en analizar */
    smtp.value = localStorage.getItem('smtp');
    analizar.click();
});
