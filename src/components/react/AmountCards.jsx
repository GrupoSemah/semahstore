import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, Tag, CreditCard } from "lucide-react";

export const AmountCards = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amounts, setAmounts] = useState({
    published: 0,
    offered: 0,
    paid: 0
  });

  useEffect(() => {
    fetchAmounts();
  }, []);

  const fetchAmounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/reservations/amounts", {
        headers: {
          'x-api-key': import.meta.env.PUBLIC_API_KEY
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener los montos");
      }

      const data = await response.json();
      setAmounts({
        published: data.publishedAmount || 0,
        offered: data.offeredAmount || 0,
        paid: data.paidAmount || 0
      });
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString("es-ES", {
      style: "currency",
      currency: "USD",
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-pulse">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg opacity-30">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
                <div>
                  <div className="h-7 w-28 bg-muted rounded-md"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md mb-6">
        <p className="text-destructive">Error al cargar los montos: {error}</p>
      </div>
    );
  }

  const cards = [
    {
      title: "Monto Publicado",
      value: formatCurrency(amounts.published),
      icon: <Tag className="h-8 w-8 text-blue-600" />,
      description: "Valor total de productos publicados",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Monto Ofertado",
      value: formatCurrency(amounts.offered),
      icon: <DollarSign className="h-8 w-8 text-amber-600" />,
      description: "Total de ofertas recibidas",
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Monto Pagado",
      value: formatCurrency(amounts.paid),
      icon: <CreditCard className="h-8 w-8 text-emerald-600" />,
      description: "Ingresos por reservas completadas",
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="border-l-4" style={{ borderLeftColor: card.color.split(" ")[1] }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className={`flex-shrink-0 mr-3 p-2 rounded-full ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
