const url = 'https://ramhowexrptrvepjsfko.supabase.co/rest/v1/images?select=id,title,category';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbWhvd2V4cnB0cnZlcGpzZmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjU1MzQsImV4cCI6MjA5NzAwMTUzNH0.mpPR0fau3qRIn2EFkZSEP8XVSmV1mYl6a6wgqVvDCuc';

async function checkData() {
    const response = await fetch(url, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } });
    const images = await response.json();
    console.log(images);
}

checkData();
