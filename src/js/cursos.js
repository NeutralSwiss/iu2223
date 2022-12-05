"use strict"

import * as Cm from './cmapi.js'
import * as V from './vistas.js'
import * as E from './eventos.js'
import * as U from './util.js'

/**
 * Para las prácticas de IU, pon aquí (o en otros js externos incluidos desde tus .htmls) el código
 * necesario para añadir comportamientos a tus páginas.
 * 
 * Este fichero actúa como el pegamento que junta todo. En particular
 * - conecta con el backend (o bueno, al menos lo simular), a través de cmapi.js
 * - genera vistas (usando vistas.js)
 * - asocia comportamientos a las vistas (con ayuda de eventos.js)
 * 
 * Fuera de las prácticas, lee la licencia: dice lo que puedes hacer con él:
 * lo que quieras siempre y cuando
 * - no digas que eres el autor original
 * - no me eches la culpa si algo no funciona como esperas
 *
 * @Author manuel.freire@fdi.ucm.es
 */

// Algunos emoticonos que puede resultar útiles: 🔍 ✏️ 🗑️ ➕ 🧑‍🏫 🧑‍🔧 👥 🎓

//
// Función que refresca toda la interfaz. Debería llamarse tras cada operación
//
function update() {
    try {
        // vaciamos los contenedores
        U.clean("#users");
        U.clean("#courses");

        // y los volvemos a rellenar con su nuevo contenido
        U.add("#courses", V.createCoursesTable(Cm.getCourses()));
        U.add("#users", V.createUserTable(Cm.getUsers()));

        // y añadimos manejadores para los eventos de los elementos recién creados

        E.bindRmCourseRow("#courses button.rm-fila", "#modalDelete .modal-title", "#cmDeleteForm", "#cmDeleteModal", () => modalDelete,
        (course) => `Eliminando curso <i>${course.name}</i>`, () => `Se eliminara el curso junto a todas sus ediciones y notas de los estudiantes de los mismos, desea continuar? Se guardara automaticamente una version de la pagina antes de eliminar el elemento`, () => update());

        E.bindRmUserRow("#users button.rm-fila", "#modalDelete .modal-title", "#cmDeleteForm", "#cmDeleteModal", () => modalDelete,
        (user) => `Eliminando user <i>${user.name}</i>`, () => `Se eliminara el usuario de todas las ediciones junto a sus datos y notas, desea continuar? Se guardara automaticamente una version de la pagina antes de eliminar el elemento` ,() => update());

        E.bindRmUserRowMassive(".remove-massive", "#modalDelete .modal-title", "#cmDeleteForm", "#cmDeleteModal", () => modalDelete,
        (users) => `Eliminando a <i>${users}</i> usuarios seleccionados`, () => `Se eliminaran los usuarios seleccionados de todas las ediciones junto a sus datos y notas, desea continuar? Se guardara automaticamente una version de la pagina antes de eliminar el elemento` ,() => update());


        E.bindAddEditionToCourse(".add-edition", () => update());

        E.bindDetails("#courses .edition-link", "#details",
            (id) => V.createDetailsForEdition(Cm.resolve(id)),
            (id) => {
                const edition = Cm.resolve(id);
                E.bindRmEditionDetails(".rm-edition", "#modalDelete .modal-title", "#cmDeleteForm", "#cmDeleteModal", () => modalDelete,
                (edition) => `Eliminando edicion <i>${edition.name}</i>`, () => `Se eliminara la ediciom junto a todas las notas de todos los estudiantes matriculados, desea continuar? Se guardara automaticamente una version de la pagina antes de eliminar el elemento`,() => update());
                E.bindAddUserToEdition(".add-profesor-to-edition",
                    "#cmModal .modal-title", "#cmEditForm", "#cmAcceptModal", () => modalEdit,
                    () => `Añadiendo profesor a <i>${edition.name}</i>`,
                    () => V.prepareAddUserToEditionModal(edition, Cm.UserRole.TEACHER),
                    () => U.one(`#d${id}`).click());
                E.bindAddUserToEdition(".add-alumno-to-edition",
                    "#cmModal .modal-title", "#cmEditForm", "#cmAcceptModal", () => modalEdit,
                    () => `Añadiendo alumno a <i>${edition.name}</i>`,
                    () => V.prepareAddUserToEditionModal(edition, Cm.UserRole.STUDENT),
                    () => U.one(`#d${id}`).click());
                update();
            });
        E.bindDetails("#users .edition-link", '#details',
            (id) => V.createDetailsForUser(Cm.resolve(id)),
            (id) => {
                E.bindSetResults(".set-result", () => U.one(`#d${id}`).click());
                update();
            }
        )

        E.bindRmFromEdition(".rm-from-edition", "#modalDelete .modal-title", "#cmDeleteForm", "#cmDeleteModal", () => modalDelete,
        (edition, user) => {
            return `Eliminando usuario <i>${user.name}</i> de la edicion <i>${edition.name}</i>`},
            () => `Se eliminaran las notas del usuario en esta edicion, desea continuar? Se guardara automaticamente una version de la pagina antes de eliminar el elemento`,() => update());

        
        E.bindAddUserToEditionMassive(".add-alumno-to-edition-massive",
                    "#cmModal .modal-title", "#cmEditForm", "#cmAcceptModal", () => modalEdit,
                    (users) => `Añadiendo <i>${users}</i> usuarios seleccionados a la Edicion`,
                    () => V.prepareAddUserToEditionModalMassive(),
                    () => {});

        E.bindAddOrEditUser(".add-user,.set-user",
            "#cmModal .modal-title", "#cmEditForm", "#cmAcceptModal", () => modalEdit,
            (user) => user ? `Editando <i>${user.name}</i>` : "Añadiendo usuario",
            (user) => V.prepareAddOrEditUserModal(user),
            () => update());

        E.bindAddOrEditCourse(".add-course,.set-course",
            "#cmModal .modal-title", "#cmEditForm", "#cmAcceptModal", () => modalEdit,
            (course) => course ? `Editando <i>${course.name}</i>` : "Añadiendo curso",
            (course) => V.prepareAddOrEditCourseModal(course),
            () => update());

        E.bindSearch("#search-in-users-input", ".user-table-row");
        E.bindSearch("#search-in-courses-input", ".course-table-row");
        E.bindSearch("#search-in-teachers-input", ".teacher-table-row");
        E.bindSearch("#search-in-students-input", ".student-table-row");
        E.bindSearch("#search-in-user-editions-input", ".user-edition-table-row");

        E.bindSortColumn("tr>th");

        //creamos los filtros de las busquedas avanzadas
        U.insertScript(V.usersScript())
        U.insertScript(V.coursesScript())
        U.insertScript(V.studentsScript())

        E.bindCheckboxColumn("#users", "");
        E.alternaBusquedaAvanzadaUsuarios("#search-advanced-toggle-users", "#search-in-users-input", "#filter-in-users")
        E.alternaBusquedaAvanzadaUsuarios("#search-advanced-toggle-courses", "#search-in-courses-input", "#filter-in-courses")
        E.alternaBusquedaAvanzadaUsuarios("#search-advanced-toggle-student", "#search-in-students-input", "#filter-in-student")


        


        
        

    } catch (e) {
        console.log('Error actualizando', e);
    }
}

// asociamos botones de prueba para guardar y restaurar estado

U.one("#save").addEventListener('click', () => E.saveState("#cmModal .modal-title", "#cmEditForm", "#cmAcceptModal", () => modalEdit,
() => `Guardar cambios en una version?`, () => `Se podra recuperar la version guardada en cualquier momento`));
U.one("#clean").addEventListener('click', () => E.deleteStates("#modalDelete .modal-title", "#cmDeleteForm", "#cmDeleteModal", () => modalDelete,
() => `Eliminar todas las versiones guardadas`, () => `Al eliminar las versiones que has guardado no podras recuperar versiones anteriores de la pagina, desea continuar?`));
U.one("#restore").addEventListener('click', () => E.undoState("#modalUndo .modal-title", "#cmUndoForm", "#cmUndoModal", () => modalUndo,
() => `Restaurar a la version anterior?`, () => `Se perderan todos datos de la version actual, desea continuar?`, () => update()));

//
// Código que se ejecuta al lanzar la aplicación. 
// No pongas código de este tipo en ningún otro sitio
//
const modalEdit = new bootstrap.Modal(document.querySelector('#cmModal'));
const modalDelete = new bootstrap.Modal(document.querySelector('#modalDelete'));
const modalUndo = new bootstrap.Modal(document.querySelector('#modalUndo'));

Cm.init()
update()

// cosas que exponemos para poder usarlas desde la consola
window.update = update;
window.Cm = Cm;
window.V = V;
window.E = E;
window.U = U;