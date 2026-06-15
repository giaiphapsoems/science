// Cấu hình Supabase (Thay thế bằng thông tin thật của bạn)
const SUPABASE_URL = 'https://ramhowexrptrvepjsfko.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbWhvd2V4cnB0cnZlcGpzZmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjU1MzQsImV4cCI6MjA5NzAwMTUzNH0.mpPR0fau3qRIn2EFkZSEP8XVSmV1mYl6a6wgqVvDCuc';

let supabaseClient = null;
try {
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' && window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (err) {
    console.error("Lỗi khởi tạo Supabase:", err);
}

// Dữ liệu mẫu
let currentImages = [
    { title: 'Tinh thể Axit Amin', mag: '400x', image_url: 'assets/amino_acid.png', category: 'Khoáng chất', author_name: 'Minh Tuấn', description: 'Cấu trúc tinh thể tuyệt đẹp dưới ánh sáng phân cực.' },
    { title: 'Tế bào biểu bì Hành tây', mag: '1000x', image_url: 'assets/onion_cells.png', category: 'Thực vật', author_name: 'Ngọc Mai', description: 'Quan sát thấy rõ nhân và thành tế bào.' },
    { title: 'Sợi Vải Tổng Hợp', mag: '200x', image_url: 'assets/fabric.png', category: 'Khác', author_name: 'Hải Đăng', description: 'Các sợi đan xen chặt chẽ.' },
    { title: 'Bào tử Nấm', mag: '800x', image_url: 'assets/spores.png', category: 'Vi sinh vật', author_name: 'Hương Giang', description: 'Bào tử nấm rơm phát triển mạnh.' }
];

let currentUser = null;
let allPosts = [];

document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('gallery');
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userDisplayName = document.getElementById('user-display-name');
    const uploadBtn = document.getElementById('upload-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const uploadModal = document.getElementById('upload-modal');
    const imageModal = document.getElementById('image-modal');

    // Modals Togglers
    document.getElementById('open-login-btn').onclick = () => loginModal.classList.add('active');
    document.getElementById('close-login').onclick = () => loginModal.classList.remove('active');
    document.getElementById('open-register-btn').onclick = () => registerModal.classList.add('active');
    document.getElementById('close-register').onclick = () => registerModal.classList.remove('active');
    
    uploadBtn.onclick = () => {
        if (!currentUser) {
            alert("Vui lòng đăng nhập để Nộp Bài Thực Hành!");
            loginModal.classList.add('active');
            return;
        }
        uploadModal.classList.add('active');
    };
    
    document.getElementById('close-upload').onclick = () => uploadModal.classList.remove('active');
    document.getElementById('close-modal').onclick = () => {
        imageModal.classList.remove('active');
        document.body.style.overflow = ''; 
    };

    window.onclick = (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            e.target.parentElement.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Khởi tạo Auth
    async function initAuth() {
        if (!supabaseClient) return;
        const { data: { session } } = await supabaseClient.auth.getSession();
        updateAuthState(session);

        supabaseClient.auth.onAuthStateChange((_event, session) => {
            updateAuthState(session);
        });
    }

    function updateAuthState(session) {
        if (session && session.user) {
            currentUser = session.user;
            authButtons.style.display = 'none';
            userMenu.style.display = 'flex';
            userMenu.classList.remove('hidden');
            userDisplayName.textContent = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
        } else {
            currentUser = null;
            authButtons.style.display = 'flex';
            userMenu.style.display = 'none';
            userMenu.classList.add('hidden');
        }
    }

    logoutBtn.onclick = async () => {
        if (supabaseClient) await supabaseClient.auth.signOut();
        alert("Đã đăng xuất!");
    };

    // Đăng nhập
    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = e.target.querySelector('button');
        
        try {
            btn.textContent = 'Đang đăng nhập...';
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            loginModal.classList.remove('active');
            e.target.reset();
        } catch (err) {
            alert("Lỗi đăng nhập: " + err.message);
        } finally {
            btn.textContent = 'Vào Lớp';
        }
    };

    // Đăng ký
    document.getElementById('register-form').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const btn = e.target.querySelector('button');
        
        try {
            btn.textContent = 'Đang tạo tài khoản...';
            const { error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });
            if (error) throw error;
            alert("Đăng ký thành công! Hãy đăng nhập để tiếp tục.");
            registerModal.classList.remove('active');
            loginModal.classList.add('active');
            e.target.reset();
        } catch (err) {
            alert("Lỗi đăng ký: " + err.message);
        } finally {
            btn.textContent = 'Đăng Ký Ngay';
        }
    };

    // Tải Bài Lên
    document.getElementById('upload-form').onsubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const fileInput = document.getElementById('upload-file');
        const title = document.getElementById('upload-title').value;
        const mag = document.getElementById('upload-mag').value;
        const category = document.getElementById('upload-category').value;
        const desc = document.getElementById('upload-desc').value;
        const file = fileInput.files[0];
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!file || !supabaseClient) return;

        try {
            submitBtn.textContent = 'Đang tải lên...';
            submitBtn.disabled = true;

            const fileExt = file.name.split('.').pop();
            const fileName = `public/${Date.now()}_${Math.floor(Math.random()*1000)}.${fileExt}`;

            const { error: uploadError } = await supabaseClient.storage
                .from('microscope_images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabaseClient.storage
                .from('microscope_images')
                .getPublicUrl(fileName);

            const authorName = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];

            const { error: insertError } = await supabaseClient
                .from('images')
                .insert([{ 
                    title: title, 
                    mag: mag, 
                    image_url: publicUrlData.publicUrl,
                    category: category,
                    description: desc,
                    author_name: authorName,
                    user_id: currentUser.id
                }]);

            if (insertError) throw insertError;

            alert("Nộp bài thành công!");
            e.target.reset();
            uploadModal.classList.remove('active');
            loadImages();
        } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra: " + error.message);
        } finally {
            submitBtn.textContent = 'Nộp Bài Lên Thư Viện';
            submitBtn.disabled = false;
        }
    };

    // Filter Buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.getAttribute('data-category');
            if (category === 'all') {
                renderGallery(allPosts);
            } else {
                renderGallery(allPosts.filter(p => p.category === category));
            }
        };
    });

    function updateFilterCounts() {
        filterBtns.forEach(btn => {
            const category = btn.getAttribute('data-category');
            let count = 0;
            if (category === 'all') {
                count = allPosts.length;
            } else {
                count = allPosts.filter(p => p.category === category).length;
            }
            
            let originalText = btn.getAttribute('data-text');
            if (!originalText) {
                originalText = btn.textContent;
                btn.setAttribute('data-text', originalText);
            }
            btn.textContent = `${originalText} (${count})`;
        });
    }

    function renderGallery(imagesToRender) {
        galleryGrid.innerHTML = '';
        
        imagesToRender.forEach((img, index) => {
            const delay = index * 0.05;
            
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.style.animationDelay = `${delay}s`;
            item.innerHTML = `
                <img src="${img.image_url}" alt="${img.title}" loading="lazy">
                <div class="item-overlay">
                    <div class="card-top">
                        <span class="card-badge">${img.category || 'Khác'}</span>
                        <span class="item-mag">${img.mag}</span>
                    </div>
                    <div class="card-bottom">
                        <h3 class="item-title">${img.title}</h3>
                        <div class="item-author">
                            <div class="avatar-mini"></div>
                            <span class="name">${img.author_name || 'Học sinh'}</span>
                        </div>
                    </div>
                </div>
            `;
            
            item.addEventListener('click', () => openArticleModal(img));
            galleryGrid.appendChild(item);
        });
    }

    function openArticleModal(img) {
        document.getElementById('modal-img').src = img.image_url;
        document.getElementById('modal-category').textContent = img.category || 'Khác';
        document.getElementById('modal-title').textContent = img.title;
        document.getElementById('modal-mag').textContent = img.mag || 'N/A';
        document.getElementById('modal-author').textContent = img.author_name || 'Học sinh ẩn danh';
        document.getElementById('modal-desc').textContent = img.description || 'Không có ghi chép quan sát nào cho mẫu vật này.';
        
        const dateEl = document.getElementById('modal-date');
        if (img.created_at) {
            dateEl.textContent = new Date(img.created_at).toLocaleDateString('vi-VN');
        } else {
            dateEl.textContent = 'N/A';
        }

        imageModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const downloadBtn = document.getElementById('download-btn');
        downloadBtn.onclick = async () => {
            const a = document.createElement('a');
            a.href = img.image_url;
            a.download = `${img.title}.jpg`;
            a.target = '_blank';
            a.click();
        };
    }

    async function loadImages() {
        if (!supabaseClient) {
            allPosts = currentImages;
            updateFilterCounts();
            renderGallery(allPosts);
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('images')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (data && data.length > 0) {
                allPosts = data;
            } else {
                allPosts = currentImages;
            }
            
            updateFilterCounts();

            const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-category');
            if (activeFilter === 'all') {
                renderGallery(allPosts);
            } else {
                renderGallery(allPosts.filter(p => p.category === activeFilter));
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
            allPosts = currentImages;
            updateFilterCounts();
            renderGallery(allPosts);
        }
    }

    initAuth();
    loadImages();
});
