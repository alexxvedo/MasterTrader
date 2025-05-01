'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAccounts } from '@/lib/accounts-context';

export function CreateEAForm({ accountId, onEACreated }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    magic: '',
  });
  const { toast } = useToast();
  const { createEA } = useAccounts();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'magic' ? value.replace(/\D/g, '') : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del EA es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.magic && formData.magic !== '0') {
      toast({
        title: 'Error',
        description: 'El magic number es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    // Si el magic number es 0, mostrar una advertencia
    if (formData.magic === '0') {
      toast({
        title: 'Advertencia',
        description: 'Magic number 0 corresponde a operaciones manuales o sin EA específico',
        variant: 'warning',
      });
    }

    try {
      setIsLoading(true);
      
      // Crear EA usando el contexto en lugar de la API
      const eaDataToCreate = {
        name: formData.name,
        magic: parseInt(formData.magic, 10),
        accountId: accountId.toString() // Asegurarnos de que el accountId sea string
      };
      
      console.log("Creando EA con datos:", eaDataToCreate);
      
      const newEA = await createEA(eaDataToCreate);
      
      console.log("EA creado exitosamente:", newEA);
      
      toast({
        title: 'EA creado',
        description: `El EA "${newEA.name}" ha sido creado correctamente`,
      });
      
      // Cerrar el diálogo primero
      setOpen(false);
      
      // Esperar un momento antes de reiniciar el formulario y llamar al callback
      setTimeout(() => {
        setFormData({ name: '', magic: '' });
        
        if (onEACreated) {
          onEACreated(newEA);
        }
      }, 100);
    } catch (error) {
      console.error('Error al crear EA:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el EA',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Crear EA</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear nuevo EA</DialogTitle>
          <DialogDescription>
            Añade un nuevo EA a esta cuenta. El magic number debe coincidir con el configurado en el EA de MetaTrader.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Nombre del EA"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="magic" className="text-right">
                Magic Number
              </Label>
              <Input
                id="magic"
                name="magic"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.magic}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Número mágico (solo dígitos)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear EA'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
