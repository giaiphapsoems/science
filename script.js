// Cấu hình Supabase (Thay thế bằng thông tin thật của bạn)
const SUPABASE_URL = 'https://snvpnudzvrcodifcwwww.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudnBudXZkenZyY29kaWZjd3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTQ5ODYsImV4cCI6MjA5NjgzMDk4Nn0.0zpZxBBX0lBKUnSlOup1Nngi7QJ6NZIi-mWj7i1qb9k';

let supabase = null;
if (SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Dữ liệu ảnh mẫu (Dùng khi chưa cấu hình Supabase)
let currentImages = [
    {
        id: 1,
        title: "Tinh thể Axit Amin",
        image_url: "assets/amino_acid.png",
        mag: "400x",
        date: "15/05/2026",
        description: "Các tinh thể axit amin phân cực dưới ánh sáng giao thoa, tạo ra những mảng màu rực rỡ và cấu trúc hình học độc đáo."
    },
    {
        id: 2,
        title: "Tế bào biểu bì Hành tây",
        image_url: "assets/onion_cells.png",
        mag: "1000x",
        date: "20/05/2026",
        description: "Cấu trúc vách tế bào rõ nét của lớp biểu bì củ hành tây được nhuộm màu để làm nổi bật nhân tế bào."
    },
    {
        id: 3,
        title: "Sợi Vải Tổng Hợp",
        image_url: "assets/fabric.png",
        mag: "200x",
        date: "01/06/2026",
        description: "Sự đan xen phức tạp của các sợi vải tổng hợp qua lăng kính hiển vi nổi."
    },
    {
        id: 4,
        title: "Bào tử Nấm",
        image_url: "assets/spores.png",
        mag: "800x",
        date: "05/06/2026",
        description: "Hình thái đa dạng của các bào tử nấm đang trong quá trình phát tán, nhuộm huỳnh quang."
    }
];

// Khởi tạo DOM elements
document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('gallery');
    
    // Modal Xem Ảnh
    const imageModal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalMag = document.getElementById('modal-mag');
    const modalDate = document.getElementById('modal-date');
    const closeImageBtn = document.getElementById('close-modal');

    // Modal Upload
    const uploadBtn = document.getElementById('upload-btn');
    const uploadModal = document.getElementById('upload-modal');
    const closeUploadBtn = document.getElementById('close-upload');

    // Hàm load ảnh từ Supabase
    async function loadImages() {
        if (!supabase) {
            console.log("Đang dùng dữ liệu mẫu. Hãy cấu hình Supabase để tải dữ liệu thật.");
            renderGallery(currentImages);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('images')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (data && data.length > 0) {
                currentImages = data;
            }
            renderGallery(currentImages);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu từ Supabase:", error);
            alert("Không thể kết nối đến Supabase. Đang hiển thị dữ liệu mẫu.");
            renderGallery(currentImages);
        }
    }

    // Hàm render Gallery
    function renderGallery(imagesToRender) {
        galleryGrid.innerHTML = '';
        
        imagesToRender.forEach((img, index) => {
            const delay = index * 0.1; // Staggered animation
            
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.style.animationDelay = `${delay}s`;
            item.innerHTML = `
                <img src="${img.image_url}" alt="${img.title}" loading="lazy">
                <div class="item-overlay">
                    <h3 class="item-title">${img.title}</h3>
                    <span class="item-mag">${img.mag}</span>
                </div>
            `;
            
            item.addEventListener('click', () => openImageModal(img));
            galleryGrid.appendChild(item);
        });
    }

    // Xử lý Image Modal
    function openImageModal(data) {
        modalImg.src = data.image_url;
        modalTitle.textContent = data.title;
        modalMag.textContent = data.mag;
        // Xử lý ngày tháng hiển thị đẹp hơn
        const dateStr = data.created_at ? new Date(data.created_at).toLocaleDateString('vi-VN') : (data.date || "");
        modalDate.textContent = dateStr;
        
        imageModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Ngăn cuộn trang
    }

    function closeImageModal() {
        imageModal.classList.remove('active');
        document.body.style.overflow = '';
        // Đợi animation xong mới xóa src để mượt
        setTimeout(() => { modalImg.src = ''; }, 300);
    }

    // Xử lý Upload Modal
    uploadBtn.addEventListener('click', () => {
        uploadModal.classList.add('active');
    });

    function closeUploadModal() {
        uploadModal.classList.remove('active');
    }

    // Đóng Modal khi bấm nút X
    closeImageBtn.addEventListener('click', closeImageModal);
    closeUploadBtn.addEventListener('click', closeUploadModal);

    // Xử lý form upload
    const uploadForm = document.getElementById('upload-form');
    const submitBtn = uploadForm.querySelector('button[type="submit"]');

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('upload-file');
        const file = fileInput.files[0];
        if (!file) return;

        const title = file.name.replace(/\.[^/.]+$/, "");
        const mag = "Không xác định";

        // --- Xử lý chế độ giả lập cục bộ (nếu chưa có Supabase) ---
        if (!supabase) {
            // Tạo URL ảo để hiển thị ảnh trên máy
            const localImageUrl = URL.createObjectURL(file);
            
            // Thêm vào danh sách hiện tại
            currentImages.unshift({
                id: Date.now(),
                title: title,
                image_url: localImageUrl,
                mag: mag,
                created_at: new Date().toISOString()
            });

            renderGallery(currentImages);
            alert("Tải ảnh lên thành công! (Chế độ giả lập cục bộ - Ảnh sẽ mất khi tải lại trang)");
            uploadForm.reset();
            closeUploadModal();
            
            submitBtn.textContent = 'Đăng Ảnh';
            submitBtn.disabled = false;
            return;
        }
        // -----------------------------------------------------------

        submitBtn.textContent = 'Đang tải lên...';
        submitBtn.disabled = true;

        try {
            // 1. Upload file lên Storage (Ép buộc đuôi .jpg và đưa vào thư mục public/)
            const fileExt = file.name.split('.').pop().toLowerCase();
            if (fileExt !== 'jpg' && fileExt !== 'jpeg') {
                alert("Do giới hạn quyền bảo mật (Policy) của bạn, hệ thống chỉ chấp nhận tải lên ảnh định dạng .jpg!");
                submitBtn.textContent = 'Đăng Ảnh';
                submitBtn.disabled = false;
                return;
            }

            const fileName = `public/${Date.now()}.jpg`; 
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('microscope_images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Lấy public URL của file vừa upload
            const { data: { publicUrl } } = supabase.storage
                .from('microscope_images')
                .getPublicUrl(fileName);

            // 3. Lưu thông tin vào Database
            const { error: insertError } = await supabase
                .from('images')
                .insert([
                    {
                        title: title,
                        image_url: publicUrl,
                        mag: mag
                    }
                ]);

            if (insertError) throw insertError;

            // 4. Thành công, load lại danh sách ảnh
            alert("Tải ảnh lên thành công!");
            uploadForm.reset();
            closeUploadModal();
            loadImages(); // Tải lại danh sách từ server

        } catch (error) {
            console.error('Lỗi upload:', error);
            alert(`Lỗi khi tải ảnh lên: ${error.message}`);
        } finally {
            submitBtn.textContent = 'Đăng Ảnh';
            submitBtn.disabled = false;
        }
    });

    // Đóng Modal khi bấm ra ngoài (backdrop)
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            closeImageModal();
            closeUploadModal();
        });
    });

    // Đóng Modal khi bấm phím ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
            closeUploadModal();
        }
    });

    // Khởi chạy: Load dữ liệu từ server khi trang vừa tải
    loadImages();
});
