document.addEventListener('DOMContentLoaded', (event) => {
    // กำหนดวันที่เริ่มต้นและสิ้นสุดของช่วง 2 เดือน
    let currentDate = new Date(); // เริ่มต้นจากเดือนปัจจุบัน

    // ฟังก์ชันสำหรับสร้างข้อมูลช่างจำลอง (Mock Data)
    // ในโลกจริง คุณจะดึงข้อมูลนี้จาก API หรือฐานข้อมูล
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


            data.push({
                id: dateString, // ใช้ dateString เป็น ID ของ task
                text: `${dateString}`, // ข้อความหลักของ task
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
        gantt.config.columns = [
            { name: "text", label: "วันที่", width: 100, resize: true },
            {
                name: "technicianInfo", label: "ช่างว่าง (A/B)", width: 120, align: "center", template: function(item) {
                    // แสดงข้อมูลช่างในคอลัมน์นี้
                    return `A: ${item.technicianA} / B: ${item.technicianB}`;
                }
            }
        ];
        gantt.config.row_height = 30; // ความสูงของแต่ละแถว
        gantt.config.task_height = 0; // ทำให้ task bar ไม่แสดง เพื่อให้เห็นแต่เซลล์
        gantt.config.show_errors = false; // ปิดการแสดง error message ของ DHTMLX ถ้าไม่อยากเห็น

        // ปิด grid column ทั้งหมดเพื่อเน้นที่วันที่และข้อมูลช่างว่าง
        gantt.config.show_grid = true; // เปิด grid
        gantt.config.show_chart = true; // เปิด chart area (ที่เราจะลงสี)

        // กำหนด template สำหรับเซลล์ในส่วนของแผนภูมิ (chart area)
        gantt.templates.task_cell_class = function(item, date) {
            const dayOfWeek = date.getDay(); // 0 = อาทิตย์, 6 = เสาร์

            // หาวันที่ตรงกันในข้อมูลของเรา
            const itemDate = new Date(item.start_date);
            if (date.toDateString() !== itemDate.toDateString()) {
                // หากเซลล์ไม่ใช่ของ task นั้น (เช่นเซลล์ถัดไปในแถวเดียวกัน)
                // หรือเป็นเซลล์ที่แสดงวันที่ในอดีต/อนาคตของ task ที่มี duration > 1
                // ซึ่งในกรณีนี้เรากำหนด duration = 1 อยู่แล้ว ดังนั้นควรตรงกันเสมอ
                // แต่อาจจะมีช่องว่าง ถ้าข้อมูลไม่ครบ
                return ''; // ไม่มีคลาสพิเศษ
            }

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
