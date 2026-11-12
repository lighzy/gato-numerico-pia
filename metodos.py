"""Generación de datos y cálculo de referencias. Índices locales a cada unidad."""
from dataclasses import dataclass
from math import prod, factorial, sin
import random

CATALOGO = {
    "Ecuaciones no lineales": ["Newton-Raphson", "Secante", "Punto fijo", "Falsa posición", "Bisección"],
    "Interpolación": ["Newton hacia adelante", "Newton hacia atrás", "Diferencias divididas", "Lagrange", "Interpolación lineal"],
    "Mínimos cuadrados": ["Línea recta", "Lineal con función", "Cuadrática con función", "Cuadrática", "Cúbica"],
    "Integración": ["Newton-Cotes cerrada", "Newton-Cotes abierta", "Simpson 1/3", "Simpson 3/8", "Regla trapezoidal"],
    "EDO": ["Euler hacia adelante", "Euler modificado", "Euler hacia atrás", "Runge-Kutta de orden superior", "Runge-Kutta de segundo orden", "Runge-Kutta de tercer orden", "Runge-Kutta de cuarto orden", "RK4 por Simpson 1/3", "RK4 por Simpson 3/8"],
}

@dataclass
class Reto:
    texto: str
    campos: tuple
    valores: tuple
    revision: str

    def correcto(self, datos):
        return len(datos) == len(self.valores) and all(abs(a-b) <= .001000001 for a,b in zip(datos,self.valores))

def raices(m,d,r,variante=0):
    s=r.randint(2,15)+14*variante
    q=r.randint(100*s*s+1,100*(s+1)**2-1)/100
    a,b=s,s+1
    n=2+d
    prompt=f"f(x) = x² − {q}. "
    if m==2:
        prompt=f"Usa g(x) = (x + {q}/x)/2. "
    prompt+=f"Realiza {n} iteraciones. "
    prompt+=f"Parte de x₀ = {a}." if m in (0,2) else f"Extremos o valores iniciales, en orden: {a}, {b}."
    f=lambda x:x*x-q
    pasos=[]
    for _ in range(n):
        if m==0:
            x=a-f(a)/(2*a)
            a=x
        elif m==2:
            x=(a+q/a)/2
            a=x
        else:
            if m==1 and f(b)==0:
                pasos.append(b)
                continue
            x=(a+b)/2 if m==4 else b-f(b)*(b-a)/(f(b)-f(a))
            if m==1:
                a,b=b,x
            elif f(a)*f(x)<=0:
                b=x
            else:
                a=x
        pasos.append(x)
    return Reto(prompt,("Primera aproximación nueva","Última aproximación"),(pasos[0],pasos[-1]),"Aproximaciones sucesivas: "+", ".join(f"{v:.6f}" for v in pasos))

def interpolar(m,d,r,variante=0):
    n=2 if m==4 else 3+d
    h=r.randint(1,4)
    xs=[r.randint(-6,4)+11*variante]
    for i in range(1,n):
        xs.append(xs[-1]+(r.randint(1,4) if m in (2,3) else h))
    ys=[r.randint(-12,20) for _ in xs]
    j=n-2 if m==1 else 0
    t=xs[j]+(xs[j+1]-xs[j])*r.choice([.25,.5,.75])
    if m==3:
        terms=[y*prod((t-xs[k])/(x-xs[k]) for k in range(n) if k!=i) for i,(x,y) in enumerate(zip(xs,ys))]
    elif m==4:
        terms=[ys[0],(t-xs[0])*(ys[1]-ys[0])/h]
    else:
        col=ys[:]
        terms=[col[-1] if m==1 else col[0]]
        for k in range(1,n):
            col=[(v-u)/(xs[i+k]-xs[i] if m==2 else 1) for i,(u,v) in enumerate(zip(col,col[1:]))]
            nodes=xs[-k:] if m==1 else xs[:k]
            term=(col[-1] if m==1 else col[0])*prod(t-x for x in nodes)
            terms.append(term if m==2 else term/(h**k*factorial(k)))
    return Reto(f"Puntos (x, y): {list(zip(xs,ys))}.\nEvalúa el interpolante en x = {t:g}.",("Valor interpolado",),(sum(terms),),"Contribuciones al interpolante: "+", ".join(f"{v:.6g}" for v in terms))

def sistema(A,b):
    mat=[row[:]+[y] for row,y in zip(A,b)]
    n=len(b)
    for k in range(n):
        j=max(range(k,n),key=lambda i:abs(mat[i][k]))
        mat[k],mat[j]=mat[j],mat[k]
        p=mat[k][k]
        mat[k]=[v/p for v in mat[k]]
        for i in range(n):
            if i!=k:
                c=mat[i][k]
                mat[i]=[v-c*w for v,w in zip(mat[i],mat[k])]
    return [row[-1] for row in mat]

def ajuste(m,d,r,variante=0):
    grados=[1,1,2,2,3]
    extra=m in (1,2)
    def base(x):
        return [x**j for j in range(grados[m]+1)]+([sin(x)] if extra else [])
    p=len(base(0))
    xs=list(range(-2,-2+p+1+d))
    ys=[r.randint(-8,16)+25*variante for _ in xs]
    cols=list(zip(*(base(x) for x in xs)))
    dot=lambda a,b:sum(x*y for x,y in zip(a,b))
    coef=sistema([[dot(i,j) for j in cols] for i in cols],[dot(i,ys) for i in cols])
    modelo=["a + bx","a + bx + c sen(x)","a + bx + cx² + d sen(x)","a + bx + cx²","a + bx + cx² + dx³"][m]
    return Reto(f"Ajusta {modelo} por mínimos cuadrados a {list(zip(xs,ys))}." + (" Usa radianes." if extra else ""),("Coeficiente a","Coeficiente b"),tuple(coef[:2]),"Solución de las ecuaciones normales, en orden: "+", ".join(f"{v:.6f}" for v in coef))

def integral(m,d,r,variante=0):
    spec=[([7,32,12,32,7],2/45,4),([2,-1,2],4/3,4),([1,4,1],1/3,2),([1,3,3,1],3/8,3),([1,1],.5,1)]
    weights,c,n=spec[m]
    a=r.randint(-5,6)+12*variante
    h=r.choice([.25,.5,1])
    b=a+n*h
    p=2+d
    u,v=r.randint(1,7),r.randint(-6,8)
    xs=[a+(i+(m==1))*h for i in range(len(weights))]
    vals=[u*x**p+v for x in xs]
    total=sum(w*y for w,y in zip(weights,vals))
    return Reto(f"Integra f(x) = {u}x^{p} + ({v}) en [{a:g}, {b:g}] con un panel de {n} subintervalos iguales.",("Integral aproximada",),(total*c*h,),f"Nodos {xs}; pesos {weights}; suma ponderada {total:.6g}; factor h × {c:.6g}.")

def edo(m,d,r,variante=0):
    a,b=r.randint(1,4),r.randint(1,8)
    t,y=0,r.randint(1,8)+8*variante
    h=r.choice([.05,.1,.2])
    v=r.randint(1,7)
    f=lambda t,y: t+b-a*y
    n=1+d
    texto=f"y′ = t + {b} − {a}y, y(0) = {y}."
    if m==3:
        texto=f"y″ = t + {b} − {a}y, y(0) = {y}, y′(0) = {v}. Usa RK2 de Heun en el sistema (y, y′)."
    if m==1:
        texto+=" Usa la regla trapezoidal implícita."
    if m==4:
        texto+=" Usa la variante de Heun."
    if m==6:
        texto+=" Usa RK4 clásico."
    pasos=[]
    for i in range(n):
        k=h*f(t,y)
        if m==0: y+=k
        elif m==1: y=(y+(k+h*(t+h+b))/2)/(1+h*a/2)
        elif m==2: y=(y+h*(t+h+b))/(1+h*a)
        elif m==3:
            pred=y+h*v
            y+=h*(v+(v+k))/2
            v+=(k+h*f(t+h,pred))/2
        elif m==4: y+=(k+h*f(t+h,y+k))/2
        elif m==5:
            l=h*f(t+h/2,y+k/2)
            y+=(k+4*l+h*f(t+h,y-k+2*l))/6
        elif m==8:
            l=h*f(t+h/3,y+k/3)
            j=h*f(t+2*h/3,y-k/3+l)
            y+=(k+3*l+3*j+h*f(t+h,y+k-l+j))/8
        else:
            l=h*f(t+h/2,y+k/2)
            j=h*f(t+h/2,y+l/2)
            y+=(k+2*l+2*j+h*f(t+h,y+j))/6
        t+=h
        pasos.append(y)
    return Reto(texto+f" Con h = {h}, realiza {n} paso(s).",("y final",),(y,),"Valores de y después de cada paso: "+", ".join(f"{v:.6f}" for v in pasos))

GENERADORES=dict(zip(CATALOGO,[raices,interpolar,ajuste,integral,edo]))
def generar(nombre,dificultad,r=random,variante=0):
    for area,lista in CATALOGO.items():
        if nombre in lista:
            return GENERADORES[area](lista.index(nombre),dificultad,r,variante)
    raise ValueError(nombre)
