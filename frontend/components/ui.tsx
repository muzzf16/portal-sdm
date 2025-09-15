import React from 'react';
import { Card as RBCard, Form } from 'react-bootstrap';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardComponentType extends React.FC<CardProps> {
  Header: typeof RBCard.Header;
  Footer: typeof RBCard.Footer;
  Title: typeof RBCard.Title;
  Text: typeof RBCard.Text;
}

const CardComponent: CardComponentType = (({ children, className }) => (
  <RBCard className={className}>
    <RBCard.Body>{children}</RBCard.Body>
  </RBCard>
)) as CardComponentType;

CardComponent.Header = RBCard.Header;
CardComponent.Footer = RBCard.Footer;
CardComponent.Title = RBCard.Title;
CardComponent.Text = RBCard.Text;

export const Card = CardComponent;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <RBCard className="d-flex flex-row align-items-center p-3">
    <div className={`p-3 rounded-circle me-3 ${color}`}>
      {icon}
    </div>
    <div>
      <RBCard.Text className="mb-1 text-muted">{title}</RBCard.Text>
      <RBCard.Title className="h4 mb-0">{value}</RBCard.Title>
    </div>
  </RBCard>
);

export const PageTitle: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
    <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">{title}</h1>
        <div>{children}</div>
    </div>
);

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value'> {
    label: string;
    size?: "sm" | "lg";
    value?: string | number | string[];
}
export const Input: React.FC<InputProps> = ({ label, id, size, ...props }) => (
    <Form.Group className="mb-3" controlId={id}>
        <Form.Label>{label}</Form.Label>
        <Form.Control size={size} {...props} />
    </Form.Group>
);

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'value'> {
    label: string;
    children: React.ReactNode;
    size?: "sm" | "lg";
    value?: string | number | string[];
}
export const Select: React.FC<SelectProps> = ({ label, id, children, size, ...props }) => (
    <Form.Group className="mb-3" controlId={id}>
        <Form.Label>{label}</Form.Label>
        <Form.Select size={size} {...props}>
            {children}
        </Form.Select>
    </Form.Group>
);

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'value'> {
    label: string;
    size?: "sm" | "lg";
    value?: string | number | string[];
}
export const Textarea: React.FC<TextareaProps> = ({ label, id, size, ...props }) => (
    <Form.Group className="mb-3" controlId={id}>
        <Form.Label>{label}</Form.Label>
        <Form.Control as="textarea" size={size} {...props} />
    </Form.Group>
);

export interface ToastMessage {
    id: number;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

export const Toast: React.FC<ToastMessage> = ({ id, message, type }) => {
    const variantClasses = {
        success: 'bg-success text-white',
        error: 'bg-danger text-white',
        info: 'bg-info text-white',
        warning: 'bg-warning text-dark',
    };
    
    const icons = {
        success: <i className="bi bi-check-circle-fill me-2"></i>,
        error: <i className="bi bi-exclamation-triangle-fill me-2"></i>,
        info: <i className="bi bi-info-circle-fill me-2"></i>,
        warning: <i className="bi bi-exclamation-triangle-fill me-2"></i>
    }

    return (
        <div id={`toast-${id}`} className={`toast align-items-center border-0 ${variantClasses[type]}`} role="alert">
            <div className="d-flex">
                <div className="toast-body d-flex align-items-center">
                    {icons[type]}
                    {message}
                </div>
                <button type="button" className="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    );
};