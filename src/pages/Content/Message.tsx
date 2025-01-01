import React from 'react';
import { UserCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type Message = {
    type: 'ai' | 'user' | 'error';
    content: string;
    action?: null | (() => void);
    actionText?: null | string;
    timestamp?: null | string;
}

export const Message = ({ message, index, isUpdatingNotebook }: { message: Message, index: number, isUpdatingNotebook: boolean }) => {
    return (
        <div key={`message-${index}`} className={`flex ${message.type === 'user' ? 'flex-col' : 'flex-col'} gap-2`}>
            {/* Avatar */}
            <div className="flex flex-row gap-2 items-center">
                <div className={`flex-shrink-0 ${message.type === 'ai' ? 'bg-orange-600' : message.type === 'error' ? 'bg-red-600' : 'bg-gray-600'} rounded-full p-2 max-h-2 max-w-2 flex items-center justify-center`}>
                    {message.type === 'ai' ? (
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    ) : message.type === 'error' ? (
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    ) : (
                        <UserCircle className="w-2 h-2 text-white " />
                    )}
                </div>
                <p className="text-sm"><strong>{message.type === 'ai' ? 'Assistant' : message.type === 'error' ? 'Error' : 'You'}</strong></p>
            </div>

            {/* Message Content */}
            <div className={`p-3 rounded-lg ${message.type === 'user'
                ? 'bg-orange-600 text-white'
                : message.type === 'error' ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}>
                {message.type === 'error' ? (
                    <div className="space-y-2">
                        <p>{message.content}</p>
                        {message.action && (
                            <button
                                onClick={message.action}
                                className="bg-white text-red-600 px-4 py-1 rounded-md text-sm font-medium hover:bg-red-50"
                            >
                                {message.actionText}
                            </button>
                        )}
                    </div>
                ) : (
                    message.content.split('@START_CODE').map((content, contentIndex) => (
                        <React.Fragment key={`content-${index}-${contentIndex}`}>
                            {contentIndex > 0 && message.type === 'ai' && (
                                <div className={(isUpdatingNotebook ? "animate-pulse " : "") + "bg-gray-800 p-2 rounded-lg my-2 flex flex-row justify-evenly max-w-52 space-x-2 border-2 border-orange-600"}>
                                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" ></path>
                                    </svg>
                                    <p><strong>Updating Notebook</strong></p>
                                </div>
                            )}
                            {content.trim().length > 0 && <Markdown components={components} remarkPlugins={[remarkGfm]}>{content}</Markdown>}
                            {message.content.trim().length === 0 && message.type === 'ai' && (
                                <div className='flex space-x-1 items-center justify-center'>
                                    <span className='sr-only'>Loading...</span>
                                    <div className='h-2 w-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]'></div>
                                    <div className='h-2 w-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]'></div>
                                    <div className='h-2 w-2 bg-white rounded-full animate-pulse'></div>
                                </div>
                            )}
                        </React.Fragment>
                    ))
                )}
            </div>
        </div>
    );
};

const components = {
    p({ children }: { children?: any; }) {
        return <p className="mb-2 last:mb-0">{children}</p>;
    },
    h1({ children }: { children?: any; }) {
        return <h1 className="text-bold text-gray-500 text-lg font-bold mb-3 last:mb-0">{children}</h1>;
    },
    h2({ children }: { children?: any; }) {
        return <h2 className="text-bold text-gray-600 font-bold mb-2 last:mb-0">{children}</h2>;
    },
    h3({ children }: { children?: any; }) {
        return <h3 className="text-bold text-sm font-bold mb-2 last:mb-0">{children}</h3>;
    },
    ol({ children }: { children?: any; }) {
        return <ol className="list-inside list-decimal">{children}</ol>;
    },
    ul({ children }: { children?: any; }) {
        return <ul className="list-inside list-disc">{children}</ul>;
    },
    li({ children }: { children?: any; }) {
        return <li className="my-1 list-item list-inside">{children}</li>;
    },
    blockquote({ children }: { children?: any; }) {
        return (
            <blockquote className="relative border-s-4 border-gray-800 bg-slate-200 pl-2 ps-4 sm:ps-6">
                {children}
            </blockquote>
        );
    },
};