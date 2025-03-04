
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20">
      <Card className="w-full max-w-md border border-border/50 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Order Flow Manager</CardTitle>
          <CardDescription>
            Streamline your order processing workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Manage your order process from quotation to delivery with an intuitive platform that connects admins and clients.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {isAuthenticated ? (
            <>
              <Button asChild className="w-full mb-2">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
              {user?.role === 'admin' && (
                <>
                  <Button asChild variant="outline" className="w-full mb-2">
                    <Link to="/create-order">Create Order</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full mb-2">
                    <Link to="/clients">Manage Clients</Link>
                  </Button>
                </>
              )}
              <Button asChild variant="outline" className="w-full mb-2">
                <Link to="/profile">Profile Settings</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="w-full mb-2">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard">View Dashboard</Link>
              </Button>
            </>
          )}
          <p className="text-xs text-muted-foreground pt-2">
            Order Flow Management Platform v1.0
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Index;
