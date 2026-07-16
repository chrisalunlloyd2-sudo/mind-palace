/* Client-side password gate for edit/basement mode */

const CORRECT_USER = 'viper';
const CORRECT_PASS = 'clamchowder';
let isArchivist = false;

function initAuth() {
    const modal = document.getElementById('auth-modal');
    const submit = document.getElementById('auth-submit');
    const close = document.querySelector('#auth-modal .close');
    const error = document.getElementById('auth-error');

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyP' && document.pointerLockElement) {
            document.exitPointerLock?.();
            modal.classList.remove('hidden');
        }
    });

    close.onclick = () => modal.classList.add('hidden');

    submit.onclick = () => {
        const u = document.getElementById('auth-user').value.trim().toLowerCase();
        const p = document.getElementById('auth-pass').value.trim();
        if (u === CORRECT_USER && p === CORRECT_PASS) {
            isArchivist = true;
            modal.classList.add('hidden');
            document.getElementById('auth-status').textContent = 'Archivist — Editing Unlocked';
            document.getElementById('auth-status').classList.add('archivist');
            document.getElementById('edit-bar').classList.remove('hidden');
            window.dispatchEvent(new Event('archivist-unlocked'));
        } else {
            error.textContent = 'Incorrect. Hall remains read-only.';
        }
    };
}

window.isArchivist = () => isArchivist;
window.initAuth = initAuth;
