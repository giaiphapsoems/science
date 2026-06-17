// Cấu hình Supabase (Thay thế bằng thông tin thật của bạn)
const SUPABASE_URL = 'https://ramhowexrptrvepjsfko.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbWhvd2V4cnB0cnZlcGpzZmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjU1MzQsImV4cCI6MjA5NzAwMTUzNH0.mpPR0fau3qRIn2EFkZSEP8XVSmV1mYl6a6wgqVvDCuc';
const EMAIL_SUFFIX = '@student.com';

let supabaseClient = null;
try {
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' && window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (err) {
    console.error("Lỗi khởi tạo Supabase:", err);
}

// Dữ liệu mẫu
let sampleImages = [
    { title: 'Tinh thể Axit Amin', mag: '400x', image_url: 'assets/amino_acid.png', category: 'Khoáng chất', author_name: 'Minh Tuấn', description: 'Cấu trúc tinh thể tuyệt đẹp dưới ánh sáng phân cực.' },
    { title: 'Tế bào biểu bì Hành tây', mag: '1000x', image_url: 'assets/onion_cells.png', category: 'Thực vật', author_name: 'Ngọc Mai', description: 'Quan sát thấy rõ nhân và thành tế bào.' },
    { title: 'Sợi Vải Tổng Hợp', mag: '200x', image_url: 'assets/fabric.png', category: 'Khác', author_name: 'Hải Đăng', description: 'Các sợi đan xen chặt chẽ.' },
    { title: 'Bào tử Nấm', mag: '800x', image_url: 'assets/spores.png', category: 'Vi sinh vật', author_name: 'Hương Giang', description: 'Bào tử nấm rơm phát triển mạnh.' }
];

let currentUser = null;
let allPosts = [];
let studentImages = [];
let currentViewMode = 'student'; // 'student' or 'sample'
let isAdmin = false; // Cờ Admin
let currentViewingImage = null; // Lưu trữ ảnh đang xem
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
    const editModal = document.getElementById('edit-modal');
    const adminControls = document.getElementById('admin-controls');
    const deleteBtn = document.getElementById('delete-post-btn');
    const editBtn = document.getElementById('edit-post-btn');

    // Chuyển đổi Tab (Ảnh Mẫu / Thực Hành)
    const viewModeBtns = document.querySelectorAll('.view-mode-btn');
    viewModeBtns.forEach(btn => {
        btn.onclick = () => {
            viewModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentViewMode = btn.getAttribute('data-mode');
            updateViewMode();
        };
    });

    function updateViewMode() {
        if (currentViewMode === 'sample') {
            allPosts = sampleImages;
        } else {
            allPosts = studentImages;
        }
        
        // Reset bộ lọc về "Tất Cả" khi chuyển tab
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-category="all"]').classList.add('active');
        
        updateFilterCounts();
        renderGallery(allPosts);
    }

    // Khởi tạo tính năng AI nhận diện ảnh
    const fileInputAI = document.getElementById('upload-file');
    const aiStatus = document.getElementById('ai-status');
    const uploadCategory = document.getElementById('upload-category');
    
    fileInputAI.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) {
            aiStatus.classList.add('hidden');
            return;
        }

        aiStatus.classList.remove('hidden');
        aiStatus.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:0.4rem; vertical-align:-3px"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> AI đang phân tích ảnh...';
        aiStatus.className = 'ai-status analyzing';
        
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = reader.result.split(',')[1];
                
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        base64Data: base64Data,
                        mimeType: file.type
                    })
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                
                const finalCategory = data.category;
                
                uploadCategory.value = finalCategory;
                
                aiStatus.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:0.4rem; vertical-align:-3px"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M7 5H3"/></svg> AI tự động nhận diện: ${finalCategory}`;
                aiStatus.className = 'ai-status success';
            };
            
            reader.onerror = () => {
                throw new Error("Không thể đọc file ảnh");
            };
            
        } catch (error) {
            console.error("Lỗi AI:", error);
            aiStatus.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:0.4rem; vertical-align:-3px"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> Lỗi AI: Không thể nhận diện`;
            aiStatus.className = 'ai-status error';
        }
    });

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
            isAdmin = (currentUser.email === 'phuocnguyen123@student.com');
            authButtons.style.display = 'none';
            userMenu.style.display = 'flex';
            userMenu.classList.remove('hidden');
            let dName = currentUser.user_metadata?.full_name || currentUser.email.replace(EMAIL_SUFFIX, '');
            if (isAdmin) dName += ' 👑 (Admin)';
            userDisplayName.textContent = dName;
        } else {
            currentUser = null;
            isAdmin = false;
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
        const username = document.getElementById('login-username').value;
        const email = username.trim().toLowerCase().replace(/\s+/g, '') + EMAIL_SUFFIX;
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
        const username = document.getElementById('reg-username').value;
        const email = username.trim().toLowerCase().replace(/\s+/g, '') + EMAIL_SUFFIX;
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

            const authorName = currentUser.user_metadata?.full_name || currentUser.email.replace(EMAIL_SUFFIX, '');

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

    // Lọc tổng hợp (Search + Category)
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    function applyFilters() {
        const activeBtn = document.querySelector('.filter-btn.active');
        const category = activeBtn ? activeBtn.getAttribute('data-category').trim().toLowerCase() : 'all';
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        
        let filtered = allPosts;
        
        if (searchTerm) {
            filtered = filtered.filter(p => 
                (p.title && p.title.toLowerCase().includes(searchTerm)) ||
                (p.author_name && p.author_name.toLowerCase().includes(searchTerm))
            );
        }

        if (category !== 'all') {
            if (category === 'khác') {
                const predefined = ['thực vật', 'động vật', 'vi sinh vật', 'khoáng chất'];
                filtered = filtered.filter(p => !p.category || !predefined.includes(p.category.trim().toLowerCase()));
            } else {
                filtered = filtered.filter(p => p.category && p.category.trim().toLowerCase() === category);
            }
        }
        
        renderGallery(filtered);
    }

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
        searchBtn.addEventListener('click', applyFilters);
    }

    // Filter Buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        };
    });

    function updateFilterCounts() {
        filterBtns.forEach(btn => {
            const category = btn.getAttribute('data-category').trim().toLowerCase();
            let count = 0;
            const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
            let filteredBase = allPosts;
            if (searchTerm) {
                filteredBase = filteredBase.filter(p => 
                    (p.title && p.title.toLowerCase().includes(searchTerm)) ||
                    (p.author_name && p.author_name.toLowerCase().includes(searchTerm))
                );
            }

            if (category === 'all') {
                count = filteredBase.length;
            } else {
                if (category === 'khác') {
                    const predefined = ['thực vật', 'động vật', 'vi sinh vật', 'khoáng chất'];
                    count = filteredBase.filter(p => !p.category || !predefined.includes(p.category.trim().toLowerCase())).length;
                } else {
                    count = filteredBase.filter(p => p.category && p.category.trim().toLowerCase() === category).length;
                }
            }
            
            let originalText = btn.getAttribute('data-text');
            if (!originalText) {
                originalText = btn.textContent;
                btn.setAttribute('data-text', originalText);
            }
            btn.textContent = `${originalText} (${count})`;
        });
    }

    // Logic xử lý chuyển chế độ layout (Grid, Gallery, List)
    const layoutBtns = document.querySelectorAll('.layout-btn');
    layoutBtns.forEach(btn => {
        btn.onclick = () => {
            layoutBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const layout = btn.getAttribute('data-layout');
            // Remove old view classes
            galleryGrid.classList.remove('view-grid', 'view-gallery', 'view-list');
            // Add new view class
            galleryGrid.classList.add(`view-${layout}`);
        };
    });

    function renderGallery(imagesToRender) {
        galleryGrid.innerHTML = '';
        
        // Preserve current layout class
        const currentLayoutBtn = document.querySelector('.layout-btn.active');
        const layoutClass = currentLayoutBtn ? `view-${currentLayoutBtn.getAttribute('data-layout')}` : 'view-grid';
        galleryGrid.className = `gallery-container ${layoutClass}`;
        
        if (imagesToRender.length === 0) {
            galleryGrid.innerHTML = `
                <div class="empty-state">
                    <h3>Chưa có ảnh nào!</h3>
                    <p>Hãy bấm "Nộp Bài Thực Hành" để trở thành người đầu tiên đóng góp vào thư viện nhé.</p>
                </div>
            `;
            return;
        }

        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-category').trim().toLowerCase();
        
        let groups = {};
        if (activeFilter === 'all') {
            const categories = ['Thực vật', 'Động vật', 'Vi sinh vật', 'Khoáng chất', 'Khác'];
            categories.forEach(cat => {
                const catImages = imagesToRender.filter(img => img.category && img.category.trim().toLowerCase() === cat.toLowerCase());
                if (catImages.length > 0) {
                    groups[cat] = catImages;
                }
            });
            const otherImages = imagesToRender.filter(img => !img.category || !categories.map(c=>c.toLowerCase()).includes(img.category.trim().toLowerCase()));
            if (otherImages.length > 0) {
                if(!groups['Khác']) groups['Khác'] = [];
                groups['Khác'] = groups['Khác'].concat(otherImages);
            }
        } else {
           // Update counts when rendering gallery
           updateFilterCounts();
            const filterNameBtn = document.querySelector('.filter-btn.active').textContent.split('(')[0].trim();
            groups[filterNameBtn] = imagesToRender;
        }

        for (const [catName, catImages] of Object.entries(groups)) {
            const section = document.createElement('div');
            section.className = 'category-section';
            
            if (activeFilter === 'all') {
                const title = document.createElement('h2');
                title.className = 'category-title';
                title.textContent = `${catName} (${catImages.length})`;
                section.appendChild(title);
            }
            
            const grid = document.createElement('div');
            grid.className = 'category-grid';
            
            catImages.forEach((img, index) => {
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
                                <span class="date" style="margin-left: auto; font-size: 0.8rem; color: var(--text-secondary);">${img.created_at ? new Date(img.created_at).toLocaleDateString('vi-VN') : ''}</span>
                            </div>
                        </div>
                    </div>
                `;
                item.addEventListener('click', () => openArticleModal(img));
                grid.appendChild(item);
            });
            
            section.appendChild(grid);
            galleryGrid.appendChild(section);
        }
    }

    function openArticleModal(img) {
        currentViewingImage = img;
        document.getElementById('modal-img').src = img.image_url;
        document.getElementById('modal-category').textContent = img.category || 'Khác';
        document.getElementById('modal-title').textContent = img.title;
        document.getElementById('modal-mag').textContent = img.mag || 'N/A';
        document.getElementById('modal-author').textContent = img.author_name || 'Học sinh ẩn danh';
        document.getElementById('modal-desc').textContent = img.description || 'Không có ghi chép quan sát nào cho mẫu vật này.';
        
        if (isAdmin) {
            adminControls.classList.remove('hidden');
            adminControls.style.display = 'flex';
        } else {
            adminControls.classList.add('hidden');
            adminControls.style.display = 'none';
        }
        
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
            studentImages = [];
            updateViewMode();
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('images')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (data && data.length > 0) {
                // Tự động phân loại nếu category bị null
                studentImages = data.map(img => {
                    if (!img.category) {
                        const text = `${img.title} ${img.description}`.toLowerCase();
                        if (text.match(/hành tây|lá|thực vật|hoa|cây|rễ|tế bào thực vật|rêu|biểu bì/)) {
                            img.category = 'Thực vật';
                        } else if (text.match(/động vật|tế bào máu|thịt|cá|côn trùng|tóc|máu|hồng cầu|bạch cầu|cánh bướm/)) {
                            img.category = 'Động vật';
                        } else if (text.match(/vi sinh vật|vi khuẩn|nấm|bào tử|trùng|paramecium|e\. coli|trùng giày|vi rút|mốc|men/)) {
                            img.category = 'Vi sinh vật';
                        } else if (text.match(/khoáng chất|tinh thể|muối|cát|đá|đất|kim loại/)) {
                            img.category = 'Khoáng chất';
                        } else {
                            img.category = 'Khác';
                        }
                    }
                    return img;
                });
            } else {
                studentImages = [];
            }
            
            updateViewMode();
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
            studentImages = [];
            updateViewMode();
        }
    }

    deleteBtn.onclick = async () => {
        if (!isAdmin || !currentViewingImage || !supabaseClient) return;
        const confirmDelete = confirm(`Bạn có chắc chắn muốn XÓA bài viết "${currentViewingImage.title}" không? Hành động này không thể hoàn tác.`);
        if (!confirmDelete) return;

        try {
            deleteBtn.textContent = "Đang xóa...";
            const { error: dbError } = await supabaseClient
                .from('images')
                .delete()
                .eq('id', currentViewingImage.id);

            if (dbError) throw dbError;

            // Xóa ảnh vật lý (optional but clean)
            if (currentViewingImage.image_url) {
                const parts = currentViewingImage.image_url.split('/microscope_images/');
                if (parts.length > 1) {
                    await supabaseClient.storage.from('microscope_images').remove([parts[1]]);
                }
            }

            alert("Đã xóa bài viết thành công!");
            imageModal.classList.remove('active');
            document.body.style.overflow = '';
            loadImages();
        } catch (err) {
            alert("Lỗi khi xóa: " + err.message);
        } finally {
            deleteBtn.textContent = "Xóa";
        }
    };

    editBtn.onclick = () => {
        if (!isAdmin || !currentViewingImage) return;
        document.getElementById('edit-post-id').value = currentViewingImage.id;
        document.getElementById('edit-title').value = currentViewingImage.title;
        document.getElementById('edit-mag').value = currentViewingImage.mag;
        document.getElementById('edit-category').value = currentViewingImage.category;
        document.getElementById('edit-desc').value = currentViewingImage.description;
        
        editModal.classList.add('active');
    };

    document.getElementById('close-edit').onclick = () => editModal.classList.remove('active');

    document.getElementById('edit-form').onsubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin || !supabaseClient) return;

        const id = document.getElementById('edit-post-id').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            submitBtn.textContent = 'Đang lưu...';
            submitBtn.disabled = true;

            const updates = {
                title: document.getElementById('edit-title').value,
                mag: document.getElementById('edit-mag').value,
                category: document.getElementById('edit-category').value,
                description: document.getElementById('edit-desc').value
            };

            const { error } = await supabaseClient
                .from('images')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            alert('Đã cập nhật bài viết thành công!');
            editModal.classList.remove('active');
            
            // Cập nhật currentViewingImage
            currentViewingImage = { ...currentViewingImage, ...updates };
            openArticleModal(currentViewingImage); // Cập nhật lại UI modal
            loadImages(); // Cập nhật lại gallery
        } catch (error) {
            console.error('Update error:', error);
            alert('Có lỗi xảy ra: ' + error.message);
        } finally {
            submitBtn.textContent = 'Lưu Thay Đổi';
            submitBtn.disabled = false;
        }
    };

    initAuth();
    loadImages();
});
