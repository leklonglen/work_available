document.addEventListener('DOMContentLoaded', (event) => {
    // กำหนดวันที่เริ่มต้นและสิ้นสุดของช่วง 2 เดือน
    let currentDate = new Date(); // เริ่มต้นจากเดือนปัจจุบัน

    // ฟังก์ชันสำหรับสร้างข้อมูลช่างจำลอง (Mock Data)
    function generateTechnicianData(startDate, endDate) {
        const data = [];
        let cursorDate = new Date(startDate);

        while (cursorDate <= endDate) {
            const dateString = cursorDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const dayOfWeek = cursorDate.getDay(); // 0 = อาทิตย์, 6 = เสาร์

            let technicianA_available = Math.floor(Math.random() * 5); // 0-4 คน
            let technicianB_available = Math.floor(Math.random() * 5); // 0-4 คน

            // ทำให้บางวันมีเงื่อนไขสีต่างๆ เพื่อทดสอบ
            if (Math.random() < 0.1) { // 10% โอกาสที่จะไม่มีช่างเลย
                technicianA_available = 0;
                technicianB_available = 0;
            } else if (Math.random() < 0.2) { // 20% โอกาสที่จะมีช่าง A/B มากกว่า 1 คน
                 if (technicianA_available <= 1) technicianA_available = Math.floor(Math.random() * 3) + 2; // อย่างน้อย 2 คน
                 if (technicianB_available <= 1) technicianB_available = Math.floor(Math.random() * 3) + 2; // อย่างน้อย 2 คน
            }

            // ใน DHTMLX Gantt แต่ละ 'task' คือ 1 แถวในตาราง
            // เราจะสร้าง task 1 วันต่อ 1 task เพื่อให้เราสามารถควบคุมสีของแต่ละวันได้
            data.push({
                id: dateString, // ใช้ dateString เป็น ID ของ task
                text: '', // ไม่ต้องแสดงข้อความในส่วน Grid (ตารางซ้าย) ถ้าต้องการให้แสดงแค่ข้อมูลช่างว่างในคอลัมน์พิเศษ
                start_date: dateString,
                duration: 1, // แต่ละ task คือ 1 วัน
                technicianA: technicianA_available,
                technicianB: technicianB_available
            });

            cursorDate.setDate(cursorDate.getDate() + 1); // เลื่อนไปวันถัดไป
        }
        return data;
    }

    // ฟังก์ชันสำหรับตั้งค่าและแสดงผล Gantt Chart
    function renderGantt(monthOffset = 0) {
        // คำนวณช่วงวันที่สำหรับ 2 เดือน
        // currentDate เป็นวันที่ที่เราใช้เป็นจุดอ้างอิง
        const firstDayOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
        const lastDayOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset + 2, 0); // สิ้นสุดของเดือนที่สอง

        // แสดงช่วงเดือนที่กำลังดู
        document.getElementById('currentMonthRange').innerText =
            `${firstDayOfPeriod.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })} - ` +
            `${lastDayOfPeriod.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`;

        // กำหนดการตั้งค่า Gantt Chart
        gantt.config.scale_unit = "day";
        gantt.config.date_scale = "%D, %d %M"; // แสดง วันในสัปดาห์, วันที่ เดือน
        gantt.config.subscales = [
            { unit: "month", step: 1, date: "%F, %Y" }
        ];

        // กำหนดคอลัมน์ในส่วน Grid (ตารางด้านซ้าย)
        gantt.config.columns = [
            { name: "text", label: "วันที่", width: 100, resize: true, template: function(item) {
                // แสดงวันที่ในคอลัมน์ "วันที่" ของ Grid
                // ถ้าต้องการแสดงวันที่แค่ใน Timeline ก็ให้ text เป็นช่องว่างได้
                return new Date(item.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'numeric' });
            }},
            {
                name: "technicianInfo", label: "ช่างว่าง (A/B)", width: 120, align: "center", template: function(item) {
                    // แสดงข้อมูลช่างในคอลัมน์นี้
                    return `A: ${item.technicianA} / B: ${item.technicianB}`;
                }
            }
        ];
        gantt.config.row_height = 30; // ความสูงของแต่ละแถว
        // gantt.config.task_height = 0; // ลบ/คอมเมนต์ บรรทัดนี้ออก
        gantt.config.show_errors = false; // ปิดการแสดง error message ของ DHTMLX ถ้าไม่อยากเห็น

        gantt.config.show_grid = true; // เปิด Grid (ตารางด้านซ้าย)
        gantt.config.show_chart = true; // เปิด Chart (ตารางวันที่ด้านขวา)

        // **สำคัญ:** กำหนด template สำหรับสีพื้นหลังของแต่ละแถวในส่วน Timeline
        // เราจะใช้ task_row_class เพื่อกำหนด class ให้กับทั้งแถวของแต่ละวัน
        gantt.templates.task_row_class = function(item, date) {
            // ในที่นี้ item คือข้อมูล task ของแต่ละวัน
            // date จะเป็นวันที่เริ่มต้นของ task นั้นๆ
            const itemDate = new Date(item.start_date);
            const dayOfWeek = itemDate.getDay(); // 0 = อาทิตย์, 6 = เสาร์

            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const technicianA = item.technicianA;
            const technicianB = item.technicianB;

            if (isWeekend) {
                return 'gantt_cell_yellow'; // วันเสาร์-อาทิตย์
            } else if (technicianA > 1 && technicianB > 1) {
                return 'gantt_cell_green'; // ช่าง A และ B ว่างเกิน 1 คน
            } else if (technicianA === 0 && technicianB === 0) {
                return 'gantt_cell_gray'; // ช่าง A และ B ไม่ว่างเลย
            }
            return ''; // ไม่มีเงื่อนไขใดๆ ตรง
        };

        // ตั้งค่าวันที่เริ่มต้นและสิ้นสุดของแผนภูมิ
        gantt.config.start_date = firstDayOfPeriod;
        gantt.config.end_date = new Date(lastDayOfPeriod.getFullYear(), lastDayOfPeriod.getMonth(), lastDayOfPeriod.getDate() + 1); // DHTMLX ต้องการ end date ถัดจากวันสุดท้าย 1 วัน

        // กำหนดให้ task bar เป็น 0 (เพื่อไม่ให้มีเส้นแสดง Task ใน Timeline)
        // แต่ยังคงให้ Timeline แสดงผลอยู่
        gantt.templates.task_class = function(start, end, task){
            return "no_task_bar"; // เพิ่มคลาสนี้เพื่อซ่อนแถบ task
        };


        // เริ่มต้นและโหลดข้อมูล
        gantt.clearAll(); // เคลียร์ข้อมูลเก่า
        gantt.init("gantt_here");

        const tasks = { data: generateTechnicianData(firstDayOfPeriod, lastDayOfPeriod) };
        gantt.parse(tasks);
    }

    // เรียกใช้ครั้งแรกเมื่อโหลดหน้า
    renderGantt();

    // Event Listeners สำหรับปุ่มนำทาง
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 2); // ย้อนกลับ 2 เดือน
        renderGantt();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 2); // เลื่อนไป 2 เดือน
        renderGantt();
    });
});
