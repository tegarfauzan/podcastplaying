
const audioPlayer = document.getElementById("audio-player");
const currentTimeElem = document.getElementById("current-time");
const totalDurationElem = document.getElementById("total-duration");
const progressBar = document.getElementById("progress-bar");
const progressHandle = document.getElementById("progress-handle");
const playPauseButton = document.getElementById("play-pause");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");
const downloadButton = document.getElementById("download");
const continueButton = document.getElementById("continue");
let repeatDisabled = false; // Untuk melacak apakah repeat dinonaktifkan atau tidak

// TABS
function toggleMedia(mediaType) {
    const audioTab = document.getElementById("audio-tab");
    const videoTab = document.getElementById("video-tab");
    const audioPlayer = document.getElementById("audio-player-container");
    const videoPlayer = document.getElementById("video-player-container");

    if (mediaType === "audio") {
        // Cek apakah elemen audio ada
        if (audioPlayer) {
            videoTab.classList.remove("active");
            videoTab.classList.add("nonactive");
            audioTab.classList.remove("nonactive");
            audioTab.classList.add("active");
            audioPlayer.classList.remove("hidden", "nonactive"); // Tampilkan audio player
            videoPlayer.classList.add("hidden", "active"); // Sembunyikan video player
        } else {
            // Jika audio player tidak ada, tetap tampilkan video player
            videoPlayer.classList.remove("hidden");
        }
    } else if (mediaType === "video") {
        audioTab.classList.remove("active");
        audioTab.classList.add("nonactive");
        videoTab.classList.remove("nonactive");
        videoTab.classList.add("active");
        // Tampilkan video player dan sembunyikan audio player
        videoPlayer.classList.remove("hidden", "nonactive");
        audioPlayer.classList.add("hidden");
    }
};


// LOGIKA PLAYER
{
    let player;
    let apiCheckInterval;
    let isDragging = false; // Menandakan apakah sedang menggeser progress
    let continueButtonClicked = false; // Menandakan apakah tombol continue diklik
    // Fungsi untuk mengecek apakah YouTube API sudah siap
    function checkYouTubeAPIReady() {
        if (typeof YT !== "undefined" && typeof YT.Player !== "undefined") {
            // Jika API sudah siap, jalankan fungsi untuk menginisialisasi player
            clearInterval(apiCheckInterval); // Hentikan pengecekan lebih lanjut
            onYouTubeIframeAPIReady();
        } else {
            console.log("API belum siap, mencoba lagi...");
        }
    }
    // Fungsi ini dipanggil otomatis ketika API YouTube sudah siap
    function onYouTubeIframeAPIReady() {
        player = new YT.Player("video-player", {
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange, // Tambahkan event listener untuk state change
            },
        });
    }
    function onPlayerReady(event) {
        console.log("Player is ready");
        // Menampilkan konten halaman setelah player siap
        const audioVideo = document.getElementById("audio-video");
        audioVideo.classList.remove("hidden");
        const playPauseButton = document.getElementById("play-pause");
        const previousButton = document.getElementById("previous");
        const nextButton = document.getElementById("next");
        const continueButton = document.getElementById("continue");
        // Mengatur event listener untuk tombol play-pause
        playPauseButton.addEventListener("click", togglePlayPause);
        // Mengatur event listener untuk tombol previous dan next
        previousButton.addEventListener("click", function () {
            seekVideo(-10); // Mundur 10 detik
        });
        nextButton.addEventListener("click", function () {
            seekVideo(10); // Maju 10 detik
        });
        // Mengatur event listener untuk tombol continue
        continueButton.addEventListener("click", function () {
            continueButtonClicked = !continueButtonClicked; // Toggle state
            if (continueButtonClicked) {
                continueButton.classList.add("opacity-100"); // Tambahkan kelas opacity
                continueButton.classList.remove("opacity-0"); // Tambahkan kelas opacity
            } else {
                continueButton.classList.remove("opacity-100"); // Hapus kelas opacity
                continueButton.classList.add("opacity-0"); // Tambahkan kelas opacity
            }
        });
        // Mengatur event listener untuk progress bar click dan drag
        const progressContainer = document.getElementById("progress-container");
        progressContainer.addEventListener("mousedown", startDragging);
        document.addEventListener("mousemove", dragging);
        document.addEventListener("mouseup", stopDragging);
        // Memperbarui total durasi video
        updateTotalDuration();
        // Memperbarui waktu saat ini dan progress bar setiap detik
        setInterval(updateCurrentTimeAndProgressBarAndHandle, 1000);
    }
    function onPlayerStateChange(event) {
        // Jika video mencapai akhir
        if (event.data === YT.PlayerState.ENDED) {
            if (!continueButtonClicked) {
                player.seekTo(0); // Kembali ke awal video
                player.playVideo(); // Memulai pemutaran lagi
            }
        }
    }
    function togglePlayPause() {
        const playPauseButton = document.getElementById("play-pause");
        console.log("Button clicked, player state:", player.getPlayerState());
        if (player.getPlayerState() === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }
    // Fungsi untuk memundurkan atau memajukan video
    function seekVideo(seconds) {
        const currentTime = player.getCurrentTime();
        player.seekTo(currentTime + seconds, true); // true untuk mengatur pemutaran segera
    }
    // Fungsi untuk memperbarui waktu saat ini dan progress bar
    function updateCurrentTimeAndProgressBarAndHandle() {
        if (!isDragging) {
            // Hanya memperbarui jika tidak sedang drag
            const currentTime = player.getCurrentTime();
            const totalDuration = player.getDuration();
            const progressPercentage = (currentTime / totalDuration) * 100;
            // Memperbarui waktu saat ini
            const formattedTime = formatTime(currentTime);
            document.getElementById("current-time").innerHTML = formattedTime;
            // Memperbarui lebar progress bar
            const progressBar = document.getElementById("progress-bar");
            progressBar.style.width = progressPercentage + "%";
            // Memperbarui posisi progress handle
            const progressHandle = document.getElementById("progress-handle");
            progressHandle.style.left = progressPercentage + "%";
        }
    }
    // Fungsi untuk memperbarui total durasi video
    function updateTotalDuration() {
        const totalDuration = player.getDuration();
        const formattedDuration = formatTime(totalDuration);
        document.getElementById("total-duration").innerHTML = formattedDuration;
    }
    // Fungsi untuk memformat waktu dalam menit:detik
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    }
    // Fungsi untuk memulai dragging (klik dan tahan)
    function startDragging(event) {
        isDragging = true;
        seekOnDrag(event); // Panggil fungsi untuk mengubah progress saat mulai drag
    }
    // Fungsi untuk mengubah progress bar saat mouse digeser
    function dragging(event) {
        if (isDragging) {
            seekOnDrag(event); // Panggil fungsi untuk memperbarui posisi
        }
    }
    // Fungsi untuk menghentikan dragging
    function stopDragging(event) {
        if (isDragging) {
            seekOnDrag(event); // Panggil fungsi terakhir untuk menetapkan posisi final
            isDragging = false; // Menghentikan dragging
        }
    }
    // Fungsi untuk mengubah progress berdasarkan posisi mouse saat drag
    function seekOnDrag(event) {
        const progressContainer = document.getElementById("progress-container");
        const rect = progressContainer.getBoundingClientRect();
        const clickX = event.clientX - rect.left; // Posisi X relatif terhadap progress-container
        const totalWidth = rect.width;
        const clickPercentage = Math.max(0, Math.min(clickX / totalWidth, 1)); // Batasi antara 0% hingga 100%
        const totalDuration = player.getDuration();
        // Mengatur waktu pemutaran berdasarkan persentase drag
        const newTime = totalDuration * clickPercentage;
        player.seekTo(newTime, true); // true untuk memulai pemutaran segera
        // Memperbarui posisi progress bar dan handle
        const progressBar = document.getElementById("progress-bar");
        const progressHandle = document.getElementById("progress-handle");
        progressBar.style.width = clickPercentage * 100 + "%";
        progressHandle.style.left = clickPercentage * 100 + "%";
    }
    // Memulai pengecekan API setiap 1 detik
    apiCheckInterval = setInterval(checkYouTubeAPIReady, 1000);
}
