# fox-on-prompt

Мод для Claude Code. Над полем ввода показывает:
- слева полосу заполнения контекста по блокам (как `/context`), с процентами;
- справа пиксельного лиса и крабика, которые курят кальян.

Работает в десктопном приложении Claude (вкладка Code) и в терминале.
Нужна версия Claude Code 2.1.289 или новее: API модов пока в раннем доступе.

## Установка (во всех чатах)

1. Распакуйте архив так, чтобы получилась папка `~/.claude/mods/fox-on-prompt`
   (в Windows: `C:\Users\<имя>\.claude\mods\fox-on-prompt`). Внутри должны лежать `.claude-plugin` и `hooks`.
2. Откройте `~/.claude/settings.json` и добавьте в блок `env` путь к папке:

   ```json
   {
     "env": {
       "CLAUDE_CODE_PLUGIN_DIRS": "C:\\Users\\<имя>\\.claude\\mods\\fox-on-prompt"
     }
   }
   ```

   На macOS/Linux: `"~/.claude/mods/fox-on-prompt"`. Если там уже есть другие папки,
   перечислите их через `;` (Windows) или `:` (macOS/Linux).
3. Откройте новый чат или перезапустите приложение.

## Разово, только в терминале

```bash
claude --plugin-dir ~/.claude/mods/fox-on-prompt
```

## Отключить

Удалите строку `CLAUDE_CODE_PLUGIN_DIRS` из `settings.json`, свернуть полосу в чате можно кнопкой `[-]`.

## Что где

- `hooks/sprite.ts` — пиксельная сцена: спрайты, цвета, раскадровка `frame(i)`.
- `hooks/chart.ts` — полоса контекста и цвета блоков.
- `hooks/register.tsx` — вывод над полем ввода, размеры (`PX`, `CHART_W`).
- Проверка: `claude plugin validate <папка>` и `claude plugin test <папка>`.
