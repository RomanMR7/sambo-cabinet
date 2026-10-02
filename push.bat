@echo off
chcp 65001 > nul
echo ===================================================
echo Отправка проекта «Цифровой кабинет самбо» в GitHub
echo ===================================================
git branch -M main
git push -u origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [УСПЕХ] Проект успешно отправлен в GitHub!
    echo Теперь перейдите на https://vercel.com/new и нажмите Import этого репозитория.
) else (
    echo.
    echo [ОШИБКА] Проверьте, создан ли репозиторий sambo-cabinet на https://github.com/new
)
echo.
pause
