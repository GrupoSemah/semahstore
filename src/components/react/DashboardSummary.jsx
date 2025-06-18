import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Tag, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const DashboardSummary = () => {
  const [data, setData] = useState({
    offers: {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      loading: true,
      error: null
    },
    reservations: {
      total: 0,
      pending: 0,
      completed: 0,
      canceled: 0,
      loading: true,
      error: null
    },
  });

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await axios.get("/api/offers");
        const offers = response.data;
        
        setData(prev => ({
          ...prev,
          offers: {
            total: offers.length,
            pending: offers.filter(o => o.status === "pending").length,
            accepted: offers.filter(o => o.status === "accepted").length,
            rejected: offers.filter(o => o.status === "rejected").length,
            loading: false,
            error: null
          }
        }));
      } catch (error) {
        setData(prev => ({
          ...prev,
          offers: {
            ...prev.offers,
            loading: false,
            error: error.message
          }
        }));
      }
    };

    const fetchReservations = async () => {
      try {
        const response = await axios.get("/api/reservations");
        const reservations = response.data;
        
        setData(prev => ({
          ...prev,
          reservations: {
            total: reservations.length,
            pending: reservations.filter(r => r.status === "pending").length,
            completed: reservations.filter(r => r.status === "completed").length,
            canceled: reservations.filter(r => r.status === "canceled").length,
            loading: false,
            error: null
          }
        }));
      } catch (error) {
        setData(prev => ({
          ...prev,
          reservations: {
            ...prev.reservations,
            loading: false,
            error: error.message
          }
        }));
      }
    };

    fetchOffers();
    fetchReservations();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Resumen del Sistema</h2>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Tarjeta de Ofertas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Ofertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.offers.loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : data.offers.error ? (
              <div className="text-red-500 text-sm">Error al cargar datos</div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{data.offers.total}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Pendientes:</span>
                    </div>
                    <Badge variant="outline">{data.offers.pending}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Aceptadas:</span>
                    </div>
                    <Badge variant="outline">{data.offers.accepted}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Rechazadas:</span>
                    </div>
                    <Badge variant="outline">{data.offers.rejected}</Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Tarjeta de Reservas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.reservations.loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : data.reservations.error ? (
              <div className="text-red-500 text-sm">Error al cargar datos</div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{data.reservations.total}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Pendientes:</span>
                    </div>
                    <Badge variant="outline">{data.reservations.pending}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Completadas:</span>
                    </div>
                    <Badge variant="outline">{data.reservations.completed}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Canceladas:</span>
                    </div>
                    <Badge variant="outline">{data.reservations.canceled}</Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
};
