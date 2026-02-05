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
        <tr class="trow">
            <td>${item.EQCode || ""}</td>
            <td>${item.LatestUpdate ? new Date(item.LatestUpdate).toLocaleDateString() : ""}</td>
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

async function getLogTable(eqcode) {
    const { data, error } = await _supabase
        .from('PTTAC_Computer_Inventory')
        .select('*')
        .eq('EQCode', eqcode)
        .order('LatestUpdate', { ascending: false });

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data) {
        return data;
    }
}

async function getComputerDetail(eqcode) {
    const { data, error } = await _supabase
        .from('Computer_Database')
        .select('*')
        .eq('EQCode', eqcode)
        .single();

    if (error) {
        console.error("Error:", error);
        return;
    }

    return data;
}

function multiFilter() {
    // 1. ดึงค่าจากทุกช่องค้นหามาเก็บไว้ และแปลงเป็นตัวพิมพ์ใหญ่
    const valEQ = document.getElementById("EQCode").value.toUpperCase();
    const valDate = document.getElementById("latestUpdate").value.toUpperCase();
    const valID = document.getElementById("ID").value.toUpperCase();
    const valName = document.getElementById("Name").value.toUpperCase();
    const valUnit = document.getElementById("Unit").value.toUpperCase();
    const valLocation = document.getElementById("Location").value.toUpperCase();
    const valAction = document.getElementById("Action").value.toUpperCase();
    const valDetail = document.getElementById("Detail").value.toUpperCase();
    const valSigned = document.getElementById("Signed").value.toUpperCase();

    // 2. เข้าถึงทุกแถวใน tbody
    const tableBody = document.getElementById("table-body");
    const rows = tableBody.getElementsByTagName("tr");

    // 3. วนลูปตรวจสอบทีละแถว
    for (let i = 0; i < rows.length; i++) {
        const tds = rows[i].getElementsByTagName("td");
        
        // ดึงข้อความจากคอลัมน์ที่ต้องการ (อ้างอิงตามลำดับ <td> ในตารางคุณ)
        const txtEQ = tds[0].textContent.toUpperCase();     // คอลัมน์ที่ 1
        const txtLatestUpdate = tds[1].textContent.toUpperCase();
        const txtID = tds[2].textContent.toUpperCase();     // คอลัมน์ที่ 3
        const txtName = tds[3].textContent.toUpperCase();   // คอลัมน์ที่ 4
        const txtUnit = tds[4].textContent.toUpperCase();
        const txtLocation = tds[5].textContent.toUpperCase();
        const txtAction = tds[6].textContent.toUpperCase();
        const txtDetail = tds[7].textContent.toUpperCase(); // คอลัมน์ที่ 8
        const txtSigned = tds[8].textContent.toUpperCase();

        // 4. ตรวจสอบเงื่อนไข (ต้องมีคำค้นหาอยู่ในข้อความนั้นๆ ทั้งหมด)
        const isMatch = txtEQ.includes(valEQ) && 
                        txtLatestUpdate.includes(valDate) &&
                        txtID.includes(valID) && 
                        txtName.includes(valName) && 
                        txtUnit.includes(valUnit) &&
                        txtLocation.includes(valLocation) &&
                        txtAction.includes(valAction) &&
                        txtDetail.includes(valDetail) &&
                        txtSigned.includes(valSigned);

        // 5. แสดงผลหรือซ่อน
        rows[i].style.display = isMatch ? "" : "none";
    }
}

document.getElementById('table-body').addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;

    const eQCode = row.children[0].innerText
    const user = row.children[3].innerText
    const unit = row.children[4].innerText

    openDialog(eQCode, user, unit)
})

async function openDialog(name, user, unit) {
    const modal = document.getElementById('infoModal');

    //แจ้งให้ User ว่ากำลังโหลด
    document.getElementById('m-name').innerText = "Loading";
    document.getElementById('m-User').innerText = "Loading";
    document.getElementById('m-Unit').innerText = "Loading";

    document.getElementById('m-SerialNumber').innerText = "Loading";
    document.getElementById('m-Model').innerText = "Loading";
    document.getElementById('m-Base').innerText = "Loading";

    modal.showModal(); // 💡 ใช้ showModal เพื่อให้มี Backdrop มืดๆ ข้างหลัง
    
    // ส่งข้อมูลเข้าไปแทนที่ใน HTML
    document.getElementById('m-name').innerText = name || "ไม่มีชื่อ";
    document.getElementById('m-User').innerText = user || "-";
    document.getElementById('m-Unit').innerText = unit || "ไม่มีรายละเอียดเพิ่มเติม";

    const data = await getComputerDetail(name);

    document.getElementById('m-SerialNumber').innerText = data.Serial_Number || "ERROR";
    document.getElementById('m-Model').innerText = data.Model || "ERROR";
    document.getElementById('m-Base').innerText = data.Base || "ERROR";

    const logData = await getLogTable(name);
    const mLogtable = document.getElementById('m-log-table');

    mLogtable.innerHTML = logData.map(item => `
        <tr class="tLogRow">
            <td>${item.LatestUpdate ? new Date(item.LatestUpdate).toLocaleDateString() : ""}</td>
            <td>${item.ID || ""}</td>
            <td>${item.Location || "-"}</td>
            <td>${item.Action || ""}</td>
            <td>${item.Detail || "-"}</td>
            <td>${item.Signed || ""}</td>
        </tr>
    `).join('');

    // ดักจับการคลิกที่ตัว Dialog
    modal.addEventListener('click', (e) => {
    // 💡 หัวใจสำคัญคือตรงนี้:
    // ถ้าจุดที่คลิก (e.target) คือตัว 'infoModal' (ซึ่งหมายถึงตัวพื้นหลัง Backdrop) 
    // ไม่ใช่เนื้อหาที่อยู่ข้างใน (Modal Content) ให้สั่งปิดทันที
        if (e.target === modal) {
            modal.close();
        }
    });

    const updateUserButton = document.getElementById('updateUserButton')
    const updateUserModal = document.getElementById('updateUserModal')

    updateUserButton.addEventListener('click', function() {
        updateUserModal.showModal();

        const inputEQCode = document.getElementById('inputEQCode');

        inputEQCode.innerText = name || "Error";

        updateUserModal.addEventListener('click', (e) => {
        if (e.target === updateUserModal) {
            updateUserModal.close();
        }});
    });

    const updateB = document.getElementById('updateB');

    updateB.onclick = async () => {

    const inputIDValue = document.getElementById('inputID').value;
    const inputNameValue = document.getElementById('inputName').value;
    const inputUnitValue = document.getElementById('inputUnit').value;
    const inputActionValue = document.getElementById('inputAction').value;
    const inputDetailValue = document.getElementById('inputDetail').value;

    if ( !inputIDValue || !inputNameValue ) {
        return alert("ID and Name is required.");
    }

    const { data, error } = await _supabase
    .from('PTTAC_Computer_Inventory')
    .insert([
        {
            EQCode: name,
            LatestUpdate: new Date(),
            Name: inputNameValue,
            ID: inputIDValue,
            Unit: inputUnitValue,
            Action: inputActionValue,
            Detail: inputDetailValue
        }
    ])
    .select();

    if (error) {
        console.error("Insert Error:", error.message);
        alert("Failed to Insert");
    } else {
        alert("Done");

        document.getElementById('inputID').value = '';
        document.getElementById('inputName').value = '';
        document.getElementById('inputUnit').value = '';
        document.getElementById('inputAction').value = '';
        document.getElementById('inputDetail').value = '';

        updateUserModal.close();
        modal.close();
        openDialog(name, user, unit);
        fetchTableData();
    }
};
}

window.onload = fetchTableData;