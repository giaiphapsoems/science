const url = 'https://ramhowexrptrvepjsfko.supabase.co/rest/v1/images?select=id,title,description';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbWhvd2V4cnB0cnZlcGpzZmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjU1MzQsImV4cCI6MjA5NzAwMTUzNH0.mpPR0fau3qRIn2EFkZSEP8XVSmV1mYl6a6wgqVvDCuc';

async function fetchAndUpdate() {
    try {
        const response = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        const images = await response.json();
        console.log(`Found ${images.length} images.`);
        
        const categories = ['Thực vật', 'Động vật', 'Vi sinh vật', 'Khoáng chất', 'Khác'];
        
        for (const img of images) {
            let cat = 'Khác';
            const text = `${img.title} ${img.description}`.toLowerCase();
            
            if (text.match(/hành tây|lá|thực vật|hoa|cây|rễ|tế bào thực vật|rêu|biểu bì/)) {
                cat = 'Thực vật';
            } else if (text.match(/động vật|tế bào máu|thịt|cá|côn trùng|tóc|máu|hồng cầu|bạch cầu/)) {
                cat = 'Động vật';
            } else if (text.match(/vi sinh vật|vi khuẩn|nấm|bào tử|trùng|paramecium|e\. coli|trùng giày|vi khuẩn|vi rút|mốc/)) {
                cat = 'Vi sinh vật';
            } else if (text.match(/khoáng chất|tinh thể|muối|cát|đá|đất|kim loại/)) {
                cat = 'Khoáng chất';
            }
            
            console.log(`Updating ID ${img.id} (${img.title}) -> ${cat}`);
            
            await fetch(`https://ramhowexrptrvepjsfko.supabase.co/rest/v1/images?id=eq.${img.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ category: cat })
            });
        }
        console.log("Done updating!");
    } catch (e) {
        console.error(e);
    }
}

fetchAndUpdate();
