# Este es un archivo de prueba para comentarios en Python
# Probando la nueva funcionalidad de soporte multi-lenguaje

def calcular_factorial(n):
    """
    Вычисляет факториал числа n
    Использует рекурсивный подход
    """
    # Базовый случай рекурсии
    if n == 0 or n == 1:
        return 1
    
    # Рекурсивный вызов
    return n * calcular_factorial(n - 1)

class ManejadorUsuarios:
    """
    Класс для управления пользователями
    Предоставляет методы CRUD
    """
    
    def __init__(self):
        # Список пользователей в памяти
        self.usuarios = []
    
    def agregar_usuario(self, nombre):
        # Добавить нового пользователя в список
        self.usuarios.append(nombre)
    
    def obtener_usuarios(self):
        # Вернуть всех пользователей
        return self.usuarios
    
    def eliminar_usuario(self, nombre):
        # Удалить пользователя по имени
        self.usuarios = [u for u in self.usuarios if u != nombre]

# Создаем экземпляр менеджера
manager = ManejadorUsuarios()

# Añadimos algunos usuarios
manager.agregar_usuario("Иван")
manager.agregar_usuario("Мария")

# Выводим список пользователей
print(manager.obtener_usuarios())
