var TestController = function()
{
    //jQuery objects from DOM
    var questionsPerPage = 6;
    var progressBar;
    var continueButton;
    var innerContent;
    var matrixBlock;
    var marksTable;
    var header;
    var title;


    /* Stages of the test
     * 0 - Welcome screen
     * 1 - Form questions
     * 2 - Matrix questions
     * 3 - Server wait
     * 4 - Result display
     * 5 - Send error
     */
    var stage = 0;
    /* Stages of the matrix test
     * 0 - Not started
     * 1 - Positive
     * 2 - Negative
     * 3 - Self
     */
    var matrixStage = 0;
    var matrixCurrent = 0;
    var matrixCurrentStart = 0;
    var matrixValues;

    var formSpinner;
    var formDescription;
    var formContent;
    var formQuestion = 0;

    var currentProgress = 0;

    var objectToSend = {};

    /*
     * Handles continueButton click-events.
     */
    var matrixQuestions = [
        "Прагматичный (\"ценит время\", \"видит выгоду\")",
        "Уважительный к людям",
        "Расчетливый (\"планово и последовательно достигает результаты\")",
        "Скромный",
        "Гибкий, ловкий, находчивый (\"в нестандартных ситуациях находит нестандартные решения\")",
        "Заботящийся о других",
        "Понимающий потребности другого",
        "Адекватно оценивающий себя",
        "Властный",
        "Альтруистичный, коллективист",
        "Преуспевающий (\"нацелен на победу\")",
        "Свободолюбивый",
        "Целеустремленный (\"видит перспективу, видит главное\")",
        "Готов оказывать помощь другому",
        "Презентабельный, внушительный (\"впечатляющий внешний вид\")",
        "Терпим к недостаткам",
        "Хороший коммуникатор (\"с любым найдет общий язык\")",
        "Исповедующий командный дух",
        "Лидирующий",
        "Открытый",
        "Располагающая внешность, \"умеет вызывать доверие\"",
        "Правдивый",
        "Умеющий манипулировать другими",
        "Доброжелательный"
    ];
    var matrixTexts = [
        {title: "Положительный эталон", text: "Для начала представьте человека, который является или мог бы являться Вашим примером для подражания. Его возраст, пол и место проживания значения не имеют, важно лишь, чтобы это был реально существующий человек, с которым Вы лично знакомы. Оцените наличие у него следующих качеств", id: "p"},
        {title: "Отрицательный эталон", text: "А теперь представьте человека, который является для Вас негативным примером т. е. человека, на которого Вы бы совершенно не хотели быть похожи. Как и в первом случае это должна быть реально существующая личность, с которой Вы знакомы. Оцените у нее наличие следующих качеств:", id: "n"},
        {title: "Я сам", text: "Это последний этап данного теста. Таким же образом оцените наличие этих качеств у себя:", id: "s"}
    ];
    var formQuestions = [
        {id: "gender", question: "Ваш пол:", answers: ["Мужской", "Женский"], specific: 0},
        {id: "education", question: "Ваше образование:", answers: ["Среднее (школа)", "Среднее - специальное(техникумы, колледжи)", "Высшее"], specific: 0},
        {id: "speciality", question: "Выберите, пожалуйста, группу, к которой относится ваша специальность:", answers: ["Управление (менеджмент)", "Технические", "Экономические", "Гуманитарные", "Военные", "Медицинские", "Социальные"], specific: 0},
        {id: "birth_place", question: "Место рождения:", answers: ["Крупный город", "Малый город", "Поселок", "Село"], specific: 0},
        {id: "living_place", question: "Место проживания:", answers: ["Крупный город", "Малый город", "Поселок", "Село"], specific: 0},
        {id: "company_type", question: "С какими предприятиями преимущественно связан Ваш опыт работы:", answers: ["Госучреждения (образование, медицина, армия и др.)", "ООО", "ОАО", "ЗАО", "ИП", "Сельхозпредприятия", "Совершенно не имею опыта работы"], specific: 0},
        {id: "mng_experience", question: "Опыт управления людьми в любом качестве:", answers: ["Есть", "Нет"], specific: 0},
        {id: "status", question: "Ваш нынешний статус:", answers: ["школьник", "студент (учащийся)", "работник организации", "безработный", "пенсионер", "частный предприниматель/владелец фирмы"], specific: 2},
        {id: "age", question: "Возраст:", answers: [], specific: 1}
    ];
    var sendErrorHandler = function()
    {
        stage = 5;
        title.html("Ошибка");
        continueButton.html("Повторить попытку отправки данных");
        innerContent.html("<h2>Что-то пошло не так!</h2><p>К сожалению, по какой-то причине данные не были отосланы на сервер. Возможно, в настояший момент у Вас проблемы с интернетом или наш сервер испытывает высокую нагрузку.</p><p>Мы не хотим, чтобы ваши данные потерялись, поэтому не закрывайте эту страницу и попробуйте нажать кнопку ниже чуть позже.</p>");
    }
    var sendSuccessHandler = function(data, textStatus, jqXHR)
    {
        stage = 4;
        title.html("Результаты");
        continueButton.hide();
        if(data.success) innerContent.html("<h2>Благодарим Вас за прохождение теста!</h2>"+data.message);
        else innerContent.html("<h2>Ошибка</h2><p>Запрос прошёл, но сервер вернул ошибку: "+data.error+"</p>");
    }
    var sendData = function()
    {
        stage = 3;
        title.html("Обработка данных...");
        innerContent.html("<h2>Пожалуйста, подождите.</h2><p>Данные обрабатываются. Это должно занять считанные секунды...</p>");
        jQuery.ajax("handler.php", {
            data: {data: JSON.stringify(objectToSend)},
            dataType: "json",
            error: sendErrorHandler,
            success: sendSuccessHandler,
            method: "POST"
        });
    }
    var increaseProgress = function()
    {
        currentProgress+=4.54;
        progressBar.width(currentProgress+"%");

    }
    var setValue = function (key, value)
    {
        objectToSend[key]=value;
        //alert(key+"="+value+"\n"+JSON.stringify(objectToSend));
    }
    var formInit = function()
    {
        stage = 1;
        title.html("Анкета");
        formSpinner = $("<div class='form-spinner'></div>");
        formDescription = $("<p></p>");
        formContent = $("<p id=\"formContent\"></p>");
        innerContent.html("");
        formSpinner.append(formDescription);
        formSpinner.append(formContent);
        innerContent.append(formSpinner);
        formUpdate();
    }
    var formUpdate = function()
    {
        var specific = formQuestions[formQuestion].specific;
        var $clone = formSpinner.clone();
        formSpinner.removeClass("slide-from-right");
        formSpinner.removeClass("form-spinner");
        formSpinner.addClass("form-spinner-init");
        innerContent.append($clone);
        setTimeout(function() {
            formSpinner.addClass("form-spinner");
            formSpinner.removeClass("form-spinner-init");
            formSpinner.addClass("slide-from-right");
            $clone.addClass("slide-to-left");
            $clone.addClass("clone");
            $clone.removeClass("slide-from-right");
            setTimeout(function() {
                $clone.remove();
            }, 500);
        }, 10);
        formContent.html("");
        formDescription.html("");
        if(specific == 1)
        {
            var input= $('<div class="input-field"><input id="input" type="text" name="formInput" class="validate"><label for="input">' + formQuestions[formQuestion].question + "<span class='hiding'>(кликнуть сюда для ввода)</span>" + '</label></div>');
            formContent.append(input);
        }
        else
        {
            formDescription.html(formQuestions[formQuestion].question);
            var ul = $("<ul></ul>");
            for(var key in formQuestions[formQuestion].answers)
            {
                var li = $("<li></li>");
                var label = $("<label/>");
                if(specific == 0)
                {
                    //Radio button
                    var input = $("<input type=\"radio\" name=\"formInput\">");
                }
                else
                {
                    //Check box
                    var input = $("<input type=\"checkbox\" name=\"formInput\">");
                }
                input.attr("value", key);
                input.attr("id", "formInput"+key)
                label.attr("for", "formInput"+key);
                label.html(formQuestions[formQuestion].answers[key]);
                li.append(input);
                li.append(label);
                ul.append(li);
            }
            formContent.append(ul);
        }
    }
    var formAccept = function()
    {
        var specific = formQuestions[formQuestion].specific;
        var selected = false;
        if(specific == 0)
        {
            var answer = $('input[name=formInput]:checked').val();
            if(typeof answer != 'undefined')
            {
                setValue(formQuestions[formQuestion].id, parseInt(answer));
                selected = true;
            }
            else
            {
                alert("Не выбран вариант ответа.");
            }
        }
        else if(specific == 1)
        {
            var answer = parseInt($('input[name=formInput]').val());
            if(answer > 0 && answer < 100)
            {
                selected = true;
                setValue(formQuestions[formQuestion].id, answer);
            }
            else
            {
                alert("Некорректное значение возраста.");
            }
        }
        else if(specific == 2)
        {
            var bitAnswer = "";
            /*for(var i = 0; i < formQuestions[formQuestion].answers.length; i++)
             {
             bitAnswer+="0";
             //setValue(formQuestions[formQuestion].id+"_"+i, 0);
             }*/
            $('input[name=formInput]:checkbox').each(function(index, element)
            {
                if(element.checked)
                {
                    selected = true;
                    bitAnswer+="1";
                }
                else bitAnswer+="0";
                //setValue(formQuestions[formQuestion].id+"_"+jElement.val(), 1);
            });
            if(selected)
            {
                setValue(formQuestions[formQuestion].id, bitAnswer);
                //alert(bitAnswer);
            }
            else alert("Не выбран ни один вариант ответа.");
        }
        if(selected)
        {
            //alert(JSON.stringify(objectToSend));
            increaseProgress();
            formQuestion++;
            if(formQuestion == formQuestions.length)
            {
                matrixInit();
            }
            else formUpdate();
        }
    }
    var matrixInit = function()
    {
        stage = 2;
        innerContent.html(matrixBlock);
        for(var i=0; i < questionsPerPage; i++)
        {
            var tr = $("<tr></tr>");
            var tdName = $("<td>Имя</td>");
            tr.append(tdName);
            for(var j=0; j <= 5; j++)
            {
                var markTd = $("<td></td>");
                var markDiv = $("<div></div>");
                markDiv.attr("data-row", i);
                markDiv.addClass(" waves-effect waves-teal");
                markDiv.attr("data-mark",j);
                markDiv.click(matrixMarkHandler);
                markTd.addClass("mark");
                markDiv.html(j);
                markTd.append(markDiv);
                tr.append(markTd);
            }
            marksTable.append(tr);
        }
        matrixBlock.removeClass("hidden");
        matrixUpdate();
    }
    var matrixUpdate = function()
    {
        var $matrixContent = $(matrixContent) ;
        var $clone = $matrixContent.clone();

        if(matrixCurrent == 0)
        {
            matrixStage++;
            matrixBlock.children("p").html(matrixTexts[matrixStage-1].text);
            title.html(matrixTexts[matrixStage-1].title);
            header.addClass("active");
            setTimeout(function() {
                header.removeClass("active");
            }, 1000);
            $('html, body').animate({
                scrollTop: 0
            }, 300, function(){
            });
        }
        matrixValues = [];
        marksTable.find("div").removeClass("active");
        matrixCurrentStart = matrixCurrent;
        marksTable.find("td:first-child").each(function(index, element) {
            $(element).html(matrixQuestions[matrixCurrent]);
            matrixCurrent++;
            matrixValues.push(-1);
        });


        $matrixContent.removeClass("slide-from-right");
        $matrixContent.removeClass("form-spinner");
        $matrixContent.addClass("form-spinner-init");
        innerContent.append($clone);
        setTimeout(function() {
            $matrixContent.addClass("form-spinner");
            $matrixContent.removeClass("form-spinner-init");
            $matrixContent.addClass("slide-from-right");
            $clone.addClass("slide-to-left");
            $clone.addClass("clone");
            $clone.removeClass("slide-from-right");
            setTimeout(function() {
                $clone.remove();
            }, 500);
        }, 10);

    }
    var matrixMarkHandler = function() {
        $(this).parents("tr").find("div").removeClass("active");
        $(this).addClass("active");
        matrixValues[parseInt($(this).attr("data-row"))] = parseInt($(this).attr("data-mark"));
    }
    var matrixAccept = function() {
        var correct = true;
        for(var key in matrixValues)
        {
            var globalId = matrixCurrentStart+parseInt(key);
            if(matrixValues[key] >= 0)
            {
                setValue("c_"+globalId+"_"+matrixTexts[matrixStage-1].id, matrixValues[key]);
            }
            else correct = false;
        }
        if(correct)
        {
            increaseProgress();
            if(matrixCurrent == matrixQuestions.length)
            {
                matrixCurrent=0;
                if(matrixStage == 3)
                {
                    //alert(JSON.stringify(objectToSend));
                    sendData();
                } else matrixUpdate();
            }
            else matrixUpdate();
        }
        else alert("Не оценено одно или несколько качеств. Для оценки кликните на соответствующее число, расположенное напротив этого качества.");
    }
    var continueButtonHandler = function()
    {
        switch(stage)
        {
            case 0:
                //matrixInit();
                //sendData();
                formInit();
                increaseProgress();
                break;
            case 1:
                formAccept();
                break;
            case 2:
                matrixAccept();
                break;
            case 5:
                sendData();
                break;
        }

    }
    var init = function()
    {
        progressBar = $("#progressBarContent");
        continueButton = $("#buttonContinue");
        innerContent = $("#innerContent");
        matrixBlock = $("#matrixContent");
        marksTable = $("#marksTable");
        header = $("#header");
        title = $("#title");
        continueButton.click(continueButtonHandler);
    }
    init();
}
$().ready(function()
{
    var test = TestController();
});