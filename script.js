const { createClient } = supabase;

const SUPABASE_URL = 'https://giqxtcswqxyrjxjmjdwt.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpcXh0Y3N3cXh5cmp4am1qZHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MzI1NjgsImV4cCI6MjA4NTMwODU2OH0.ZlktTnkQHCwFc7JqvySEsCa4CDECqfMbjIiqvaMkhQs'

const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function fetchTableData() {
    const { data, error } = await _supabase
        .from('PTTAC_Computer_Inventory')
        .select('*')
        .order('LatestUpdate', { ascending: false }); // เอาวันที่ล่าสุดขึ้นก่อน

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data) {
        const uniqueData = [];
        const seenEQCodes = new Set();
        data.forEach(item => {
            if (!seenEQCodes.has(item.EQCode)) {
                seenEQCodes.add(item.EQCode);
                uniqueData.push(item);
            }
        });

        // 💡 3. เพิ่มการเรียงลำดับตัวอักษร (A-Z) ตาม EQCode
        uniqueData.sort((a, b) => {
            return a.EQCode.localeCompare(b.EQCode);
        });

        // 4. นำข้อมูลที่เรียงแล้วไปแสดงผล (เหมือนเดิม)
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = uniqueData.map(item => `
        <tr>
            <td>${item.EQCode || ""}</td>
            <td>${item.LatestUpdate ? new Date(item.LatestUpdate).toLocaleString() : ""}</td>
            <td>${item.ID || ""}</td>
            <td>${item.Name || ""}</td>
            <td>${item.Unit || ""}</td>
            <td>${item.Location || ""}</td>
            <td>${item.Action || ""}</td>
            <td>${item.Detail || ""}</td>
            <td>${item.Signed || ""}</td>
        </tr>
        `).join('');
    }
}

fetchTableData()