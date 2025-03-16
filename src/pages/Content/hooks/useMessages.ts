import { useState } from 'react';
import { Message } from "../Message";

export const useMessages = () => {
    const [messages, setMessages] = useState(initialMessages);
  
    const addMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const setCurrentMessage = (message: ((prevCurrent: string) => string) | string) => {
        setMessages((previousMessages) => {
            const newMessage = typeof message === 'function' ? message(previousMessages[previousMessages.length - 1]?.content || '') : message;
            const updatedMessages = [...previousMessages];
            updatedMessages[updatedMessages.length - 1] = { ...updatedMessages[updatedMessages.length - 1], content: newMessage };
            return updatedMessages;
        });
    };

    const resetMessages = () => {
        setMessages(initialMessages);
    };

    const addErrorMessage = (errorMessage: string, action?: () => void, actionText?: string) => {
        setMessages(prev => [
            ...(prev[-1]?.type === 'ai' ? prev.slice(0, -1) : prev),
            {
                type: 'error',
                content: errorMessage,
                action,
                actionText,
                timestamp: new Date().toISOString()
            }
        ] as Message[]);
    }
  
    return {
        messages,
        addMessage,
        addErrorMessage,
        setCurrentMessage,
        resetMessages,
    };
  };

  
const initialMessages = [
    {
        type: 'ai',
        content: `Welcome to the ColabAI Assistant! I can help you generate content for your notebook. Just type your prompt and I'll take care of the rest.`
    },
    // {
    //     type: 'user',
    //     content: 'Generate content about...'
    // },
//     {
//         type: 'ai',
//         content: `This notebook is a comprehensive guide for **face editing using StyleGAN**, specifically focusing on encoding real face images into StyleGAN's latent space. Here's what you can achieve with it:

// ### Key Features:
// 1. **Encoding Real Faces into StyleGAN Latent Space**:
//    - Upload or capture images of faces.
//    - Automatically align and preprocess the images.
//    - Encode the images into StyleGAN's latent space using a pretrained ResNet encoder and optimization techniques.

// 2. **Generate and Manipulate Faces**:
//    - Generate high-quality face images from the encoded latent vectors.
//    - Compare the generated images with the original ones.
//    - Save the latent vectors for further manipulation in a second notebook.

// 3. **Customization and Optimization**:
//    - Adjust encoding parameters (e.g., optimizer, learning rate, iterations) to improve results.
//    - Use face masks to preserve specific features like hair during optimization.

// 4. **Interactive Workflow**:
//    - Upload images manually or capture them using your webcam.
//    - Visualize and clean up the aligned images before encoding.
//    - Download the latent vectors and optimization videos for offline use.

// ### Use Cases:
// - **Face Editing**: Modify facial attributes (e.g., age, expression, hairstyle) by manipulating latent vectors.
// - **Creative Projects**: Generate unique faces for art, design, or storytelling.
// - **Research**: Experiment with GANs and latent space representations.
// - **Education**: Learn about StyleGAN, latent space optimization, and image generation.

// ### Next Steps:
// 1. **Run the Notebook**:
//    - Enable GPU acceleration for faster processing.
//    - Follow the instructions to upload or capture images.
//    - Execute the encoding process and generate results.

// 2. **Manipulate Latent Vectors**:
//    - Use the saved latent vectors (\`output_vectors.npy\`) in the second notebook for advanced face editing.

// 3. **Experiment**:
//    - Play with encoding parameters to achieve better results.
//    - Explore the StyleGAN latent space for creative applications.

// Let me know if you'd like help with any specific part of the notebook!`
//     }
] as Message[];