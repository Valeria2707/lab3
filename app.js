const dotenv = require("dotenv");
dotenv.config();

const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

const mainMenu = {
  reply_markup: {
    keyboard: [
      [{ text: "Студент" }, { text: "IT Технології" }, { text: "Контакти" }],
      [{ text: "Чат з AI" }],
    ],
    resize_keyboard: true,
  },
};

const contactMenu = {
  reply_markup: {
    keyboard: [
      [
        {
          text: "Поділитися контактом",
          request_contact: true,
        },
      ],
      [{ text: "Назад" }],
    ],
    resize_keyboard: true,
  },
};

const userStates = new Map();

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Ласкаво просимо! Оберіть одну з опцій нижче:",
    mainMenu
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (userStates.get(chatId) === "chatting") {
    if (text === "Вийти") {
      userStates.delete(chatId);
      bot.sendMessage(chatId, "Ви вийшли з чату з AI.", mainMenu);
    } else {
      await handleAIResponse(chatId, text);
    }
    return;
  }

  switch (text) {
    case "Студент":
      bot.sendMessage(chatId, "Завадецька Валерія ІС-13");
      break;
    case "IT Технології":
      bot.sendMessage(chatId, "Фронт-енд, Бек-енд, Веб");
      break;
    case "Контакти":
      bot.sendMessage(
        chatId,
        "Натисніть кнопку нижче, щоб поділитися контактом:",
        contactMenu
      );
      break;
    case "Назад":
      bot.sendMessage(chatId, "Повернення до головного меню:", mainMenu);
      break;
    case "Чат з AI":
      userStates.set(chatId, "chatting");
      bot.sendMessage(
        chatId,
        "Ви увійшли в чат з AI. Надішліть повідомлення або натисніть 'Вийти', щоб повернутися.",
        {
          reply_markup: {
            keyboard: [[{ text: "Вийти" }]],
            resize_keyboard: true,
          },
        }
      );
      break;
    default:
      if (msg.contact) {
        const contact = msg.contact;
        bot.sendMessage(
          chatId,
          `Отримано контакт:\nІм'я: ${contact.first_name}\nНомер телефону: ${contact.phone_number}`
        );
      } else {
        bot.sendMessage(
          chatId,
          "Будь ласка, оберіть одну з опцій, натиснувши на кнопку нижче:",
          mainMenu
        );
      }
      break;
  }
});

async function handleAIResponse(chatId, userText) {
  try {
    const response = await fetch(
      "https://api.ai21.com/studio/v1/j2-mid/complete",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AI21_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userText,
          maxTokens: 50,
          temperature: 0.7,
          topP: 0.9,
          numResults: 1,
        }),
      }
    );

    const result = await response.json();

    if (result.completions?.length > 0) {
      const reply = result.completions[0].data.text;
      bot.sendMessage(chatId, reply);
    } else {
      bot.sendMessage(chatId, "Не вдалося отримати відповідь.");
    }
  } catch (error) {
    console.error("Помилка при спілкуванні з AI:", error);
    bot.sendMessage(
      chatId,
      "Виникла помилка при спілкуванні з AI. Спробуйте пізніше."
    );
  }
}
