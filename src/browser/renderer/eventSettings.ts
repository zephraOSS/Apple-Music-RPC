export function init() {
    const data = [
        {
            selector: ".settings_setting:has(input#config_wakandaForeverMode)",
            dates: ["YYYY-08-28", "2022-11-11"],
            configKey: "wakandaForeverMode",
            disabledConfigValue: false
        }
    ];

    data.forEach(({ selector, dates, configKey, disabledConfigValue }) => {
        const ele = document.querySelector(selector);

        if (ele) {
            const today = new Date(),
                todayString = `${today.getFullYear()}-${
                    today.getMonth() + 1
                }-${today.getDate()}`;

            let notTodayCount = 0;

            dates.forEach(async (date) => {
                date = date
                    .replace("YYYY", today.getFullYear().toString())
                    .replace("MM", (today.getMonth() + 1).toString())
                    .replace("DD", today.getDate().toString());

                if (date !== todayString) notTodayCount++;
                if (notTodayCount === dates.length) {
                    ele.remove();

                    if (
                        (await window.electron.config.get(configKey)) !==
                        disabledConfigValue
                    ) {
                        window.electron.config.set(
                            configKey,
                            disabledConfigValue
                        );
                    }
                }
            });
        }
    });
}
