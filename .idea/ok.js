let stream      = null;
let isClockOut  = false;

// ── Modal ──────────────────────────────────────────────────────

function openModal() {
    isClockOut = false;
    document.getElementById('modalTitle')
            .textContent = 'Clock in';
    document.getElementById('confirmBtn')
            .textContent = 'Confirm clock in';
    document.getElementById('confirmBtn')
            .onclick = confirmClockIn;
    openModalBase();
}

function openClockOutModal() {
    isClockOut = true;
    document.getElementById('modalTitle')
            .textContent = 'Clock out';
    document.getElementById('confirmBtn')
            .textContent = 'Confirm clock out';
    document.getElementById('confirmBtn')
            .onclick = confirmClockOut;
    openModalBase();
}

function openModalBase() {
    document.getElementById('clockModal')
            .style.display = 'flex';
    document.getElementById('cameraStep')
            .style.display = 'block';
    document.getElementById('previewStep')
            .style.display = 'none';
    document.getElementById('successStep')
            .style.display = 'none';
    updateModalTime();
}

function closeModal() {
    document.getElementById('clockModal')
            .style.display = 'none';
    stopCamera();
}

function updateModalTime() {
    const now  = new Date();
    const time = now.toLocaleTimeString('en-IN',
            { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('en-IN',
            { weekday: 'long', day: 'numeric',
              month: 'long' });
    document.getElementById('modalTime')
            .textContent = time + ' · ' + date;
}

// ── Camera ─────────────────────────────────────────────────────

function startCamera() {
    const video       = document.getElementById(
            'videoPreview');
    const placeholder = document.getElementById(
            'cameraPlaceholder');
    const guide       = document.getElementById(
            'faceGuide');

    if (navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
                .getUserMedia({ video: { facingMode: 'user' } })
                .then(s => {
                    stream              = s;
                    video.srcObject     = s;
                    video.play();
                    video.style.display       = 'block';
                    placeholder.style.display = 'none';
                    guide.style.display       = 'flex';
                })
                .catch(() => {
                    document.querySelector(
                            '#cameraPlaceholder p')
                            .textContent =
                            'Camera not available';
                });
    }
}

function captureSelfie() {
    const video  = document.getElementById('videoPreview');
    const canvas = document.getElementById('selfieCanvas');
    const ctx    = canvas.getContext('2d');

    if (video.style.display === 'none') {
        canvas.width  = 320;
        canvas.height = 190;
        ctx.fillStyle = '#F7F8FA';
        ctx.fillRect(0, 0, 320, 190);
        ctx.fillStyle = '#A0AEC0';
        ctx.font      = '13px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('Selfie captured ✓', 160, 100);
    } else {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        stopCamera();
    }

    document.getElementById('cameraStep')
            .style.display = 'none';
    document.getElementById('previewStep')
            .style.display = 'block';
}

function retakeSelfie() {
    document.getElementById('cameraStep')
            .style.display = 'block';
    document.getElementById('previewStep')
            .style.display = 'none';
    startCamera();
}

// ── Clock In ───────────────────────────────────────────────────

function confirmClockIn() {
    const canvas = document.getElementById('selfieCanvas');

    canvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('selfie', blob, 'selfie.jpg');

        fetch('/attendance/clockin', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {

                // Show success step
                document.getElementById('previewStep')
                        .style.display = 'none';
                document.getElementById('successStep')
                        .style.display = 'block';
                document.getElementById('successTime')
                        .textContent = data.time;
                document.getElementById('successTitle')
                        .textContent = 'Clocked in!';
                document.getElementById('successSub')
                        .textContent =
                        'Have a great day!';

                // Update dashboard UI
                document.getElementById('clockStatus')
                        .textContent =
                        'Clocked in at ' + data.time;
                document.getElementById('clockSubtext')
                        .textContent =
                        'On time · Have a great day!';

                // Change button to Clock Out
                const btn = document.getElementById(
                        'clockInBtn');
                btn.innerHTML =
                        '<i class="ti ti-camera"></i>'
                        + ' Clock out';
                btn.style.backgroundColor = '#E31837';
                btn.onclick = openClockOutModal;

            } else {
                showClockMessage(data.message, 'error');
                closeModal();
            }
        })
        .catch(error => {
            showClockMessage(
                    'Something went wrong.', 'error');
            console.error('Clock in error:', error);
        });

    }, 'image/jpeg');
}

// ── Clock Out ──────────────────────────────────────────────────

function confirmClockOut() {
    const canvas = document.getElementById('selfieCanvas');

    canvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('selfie', blob, 'selfie.jpg');

        fetch('/attendance/clockout', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {

                // Show success step
                document.getElementById('previewStep')
                        .style.display = 'none';
                document.getElementById('successStep')
                        .style.display = 'block';
                document.getElementById('successTime')
                        .textContent = data.time;
                document.getElementById('successTitle')
                        .textContent = 'Clocked out!';
                document.getElementById('successSub')
                        .textContent =
                        'Total hours: '
                        + data.totalHours + ' hrs'
                        + ' · See you tomorrow!';

                // Update dashboard UI
                document.getElementById('clockStatus')
                        .textContent =
                        'Clocked out at ' + data.time;
                document.getElementById('clockSubtext')
                        .textContent =
                        'Total: ' + data.totalHours
                        + ' hrs · See you tomorrow!';

                // Disable button
                const btn = document.getElementById(
                        'clockInBtn');
                btn.innerHTML =
                        '<i class="ti ti-clock-check"></i>'
                        + ' Clocked out';
                btn.style.backgroundColor = '#718096';
                btn.disabled = true;
                btn.onclick  = null;

            } else {
                showClockMessage(data.message, 'error');
                closeModal();
            }
        })
        .catch(error => {
            showClockMessage(
                    'Something went wrong.', 'error');
            console.error('Clock out error:', error);
        });

    }, 'image/jpeg');
}

// ── Stop Camera ────────────────────────────────────────────────

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }
    const video = document.getElementById('videoPreview');
    video.style.display = 'none';
    document.getElementById('cameraPlaceholder')
            .style.display = 'flex';
    document.getElementById('faceGuide')
            .style.display = 'none';
}

// ── Toast message ──────────────────────────────────────────────

function showClockMessage(message, type) {
    const existing = document.getElementById(
            'clockMessage');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'clockMessage';
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: ${type === 'success'
                ? '#F0FFF4' : '#FFF5F5'};
        color: ${type === 'success'
                ? '#276749' : '#C53030'};
        border: 1px solid ${type === 'success'
                ? '#C6F6D5' : '#FED7D7'};
    `;
    div.innerHTML = `
        <i class="ti ti-${type === 'success'
                ? 'circle-check' : 'alert-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(div);

    setTimeout(() => {
        div.style.transition = 'opacity 0.5s';
        div.style.opacity    = '0';
        setTimeout(() => div.remove(), 500);
    }, 4000);
}

// ── Close modal on overlay click ───────────────────────────────

document.getElementById('clockModal')
        .addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ── Page load ──────────────────────────────────────────────────

window.onload = function() {
    const clockedIn =
            /*[[${dashboard.clockedIn}]]*/ false;

    if (clockedIn) {
        const btn = document.getElementById('clockInBtn');
        btn.innerHTML =
                '<i class="ti ti-camera"></i> Clock out';
        btn.style.backgroundColor = '#E31837';
        btn.onclick = openClockOutModal;
    }
};